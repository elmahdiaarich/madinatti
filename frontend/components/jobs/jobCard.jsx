import Link from 'next/link';

const CONTRACT_LABELS = {
  CDI:          { label: 'CDI' },
  CDD:          { label: 'CDD' },
  STAGE:        { label: 'Stage' },
  FREELANCE:    { label: 'Freelance' },
  INTERIM:      { label: 'Intérim' },
  ALTERNANCE:   { label: 'Alternance' },
  ANAPEC:       { label: 'Anapec' },
  TEMPS_PARTIEL:{ label: 'Temps partiel' },
  STATUTAIRE:   { label: 'Statutaire' },
};

const EDUCATION_LABELS = {
  BEFORE_BAC:    'Qualification avant Bac',
  BAC:           'Bac',
  BAC_PLUS_1:    'Bac+1',
  BAC_PLUS_2:    'Bac+2',
  BAC_PLUS_3:    'Bac+3',
  BAC_PLUS_4:    'Bac+4',
  BAC_PLUS_5_PLUS: 'Bac+5 et plus',
};

const EXPERIENCE_LABELS = {
  STUDENT_FRESH_GRAD: 'Étudiant, jeune diplômé',
  JUNIOR_LESS_2:      'Débutant < 2 ans',
  MID_2_TO_5:         'Entre 2 et 5 ans',
  SENIOR_5_TO_10:     'Entre 5 et 10 ans',
  EXPERT_PLUS_10:     '> 10 ans',
};

function CompanyLogo({ logo, name }) {
  return (
    <div className="w-[130px] h-[130px] shrink-0 bg-white border border-[#A7D129]/40 rounded-xl flex items-center justify-center overflow-hidden">
      {logo ? (
        <>
          <img
            src={logo}
            alt={name}
            className="w-full h-full object-contain p-3"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div
            className="w-full h-full items-center justify-center text-[#2D5016] font-bold text-3xl bg-[#E8F5D0]"
            style={{ display: 'none' }}
          >
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#2D5016] font-bold text-3xl bg-[#E8F5D0]">
          {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, valueClass = '' }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-1 text-sm flex-wrap">
      <span className="text-gray-500 shrink-0">{label} :</span>
      <span className={`font-semibold text-gray-800 ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function JobCard({ job }) {
  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = (v) => Number(v).toLocaleString('fr-MA');
    if (min && max) return `${fmt(min)} – ${fmt(max)} MAD/mois`;
    if (min) return `À partir de ${fmt(min)} MAD/mois`;
    return null;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const contract = CONTRACT_LABELS[job.contractType];
  const skills = Array.isArray(job.skills) ? job.skills.slice(0, 5).join(' - ') : null;

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="bg-[#E8F5D0] hover:bg-[#d8edbb] border border-[#A7D129]/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:border-[#A7D129]">
        <div className="flex gap-5">

          {/* Logo */}
          <CompanyLogo logo={job.user?.companyLogo} name={job.companyName} />

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">

            {/* Title + company + date */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-[#2D5016] transition-colors line-clamp-2">
                  {job.title}
                </h2>
                <span className="text-xs text-gray-400 shrink-0 mt-1">
                  {formatDate(job.publishedAt)}
                </span>
              </div>
              <span className="text-[#2D5016] font-semibold text-sm mt-0.5 block">
                {job.companyName}
              </span>
            </div>

            {/* Info rows */}
            <div className="flex flex-col gap-1.5">
              <InfoRow label="Niveau d'études requis" value={EDUCATION_LABELS[job.educationLevel]} />
              <InfoRow label="Niveau d'expérience"    value={EXPERIENCE_LABELS[job.experienceLevel]} />
              <InfoRow label="Contrat proposé"         value={contract?.label || job.contractType} />
              <InfoRow label="Région de"               value={job.location} />
              <InfoRow
                label="Salaire"
                value={formatSalary(job.salaryMin, job.salaryMax)}
                valueClass="text-[#2D5016]"
              />
              <InfoRow label="Compétences clés" value={skills} />
            </div>

          </div>
        </div>
      </div>
    </Link>
  );
}
