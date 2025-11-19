"use client";

export default function VersionBadge() {
  // This will be replaced at build time
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

  // Format: buildYYYYMMDD-hhmmss
  const formatBuildVersion = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `build${year}${month}${day}-${hours}${minutes}${seconds}`;
  };

  const version = formatBuildVersion(buildTime);

  return (
    <div className="fixed bottom-2 right-2 text-xs text-white bg-gray-900/50 px-2 py-1 rounded backdrop-blur-sm z-50 font-mono">
      {version}
    </div>
  );
}
