import Image from "next/image";

export default function Logo() {
  return (
    <Image
      src="/logo-new.svg"
      alt="Madinatti A Ville"
      width={512}
      height={370}
      priority
      className="h-16 w-auto object-contain bg-white"
    />
  );
}
