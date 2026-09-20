const axios = require('axios');
const prisma = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

function parseCvAsset(value, cloudName = process.env.CLOUDINARY_CLOUD_NAME) {
  const url = new URL(value);
  if (!cloudName || url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com'
      || url.port || url.username || url.password || url.search || url.hash) {
    throw new Error('Invalid CV asset');
  }
  const segments = url.pathname.slice(1).split('/');
  const [cloud, resourceType, type, version, ...asset] = segments;
  if (cloud !== cloudName || !['raw', 'image'].includes(resourceType)
      || !['upload', 'authenticated', 'private'].includes(type) || !/^v\d+$/.test(version)
      || !['cv', 'candidate-cv'].includes(asset[0]) || asset.length < 2
      || !asset.every((part) => /^[a-zA-Z0-9_.-]+$/.test(part) && part !== '.' && part !== '..')
      || !asset.at(-1).endsWith('.pdf')) {
    throw new Error('Invalid CV asset');
  }
  const publicId = asset.join('/');
  return { resourceType, type, publicId: resourceType === 'raw' ? publicId : publicId.slice(0, -4) };
}

async function findAuthorizedCv({ applicationId, candidateId, mine }, user) {
  if (applicationId) {
    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      select: { userId: true, cvPath: true, jobListing: { select: { userId: true } } },
    });
    if (!application || (user.role !== 'admin' && application.userId !== user.userId
        && application.jobListing.userId !== user.userId)) return null;
    return application.cvPath;
  }
  const candidate = await prisma.candidateProfile.findUnique({
    where: mine ? { userId: user.userId } : { id: candidateId },
    select: { id: true, userId: true, cvUrl: true, visibleToRecruiters: true },
  });
  if (!candidate) return null;
  if (user.role === 'admin' || candidate.userId === user.userId) return candidate.cvUrl;
  if (user.role !== 'business' || !candidate.visibleToRecruiters) return null;
  const unlock = await prisma.candidateUnlock.findUnique({
    where: { businessUserId_candidateProfileId: {
      businessUserId: user.userId, candidateProfileId: candidate.id,
    } },
    select: { id: true },
  });
  return unlock ? candidate.cvUrl : null;
}

async function readCv(value) {
  const asset = parseCvAsset(value);
  // Generate a server-controlled API destination, never fetch a caller's URL.
  // This also supports legacy public PDFs until they are migrated in Cloudinary.
  const url = cloudinary.utils.private_download_url(asset.publicId, asset.resourceType === 'raw' ? null : 'pdf', {
    resource_type: asset.resourceType, type: asset.type,
    expires_at: Math.floor(Date.now() / 1000) + 60, attachment: true,
  });
  const response = await axios.get(url, {
    responseType: 'arraybuffer', timeout: 10000, maxRedirects: 0,
    maxContentLength: 5 * 1024 * 1024,
  });
  const data = Buffer.from(response.data);
  if (data.subarray(0, 5).toString() !== '%PDF-') throw new Error('Invalid PDF');
  return data;
}

module.exports = { findAuthorizedCv, readCv, parseCvAsset };
