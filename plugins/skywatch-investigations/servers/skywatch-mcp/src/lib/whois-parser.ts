// pattern: Functional Core
// Pure function module for parsing WHOIS response text

export type WhoisResult = {
  readonly registrar: string | null;
  readonly creationDate: string | null;
  readonly expirationDate: string | null;
  readonly nameservers: Array<string>;
  readonly domainAge: number | null;
  readonly rawText: string;
};

function extractField(text: string, patterns: Array<RegExp>): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractNameservers(text: string): Array<string> {
  const nsPattern = /Name\s+Server:\s*(.+)/gi;
  const matches = text.matchAll(nsPattern);
  const nameservers: Array<string> = [];

  for (const match of matches) {
    if (match[1]) {
      nameservers.push(match[1].trim());
    }
  }

  return nameservers;
}

function calculateDomainAge(creationDateStr: string | null): number | null {
  if (!creationDateStr) {
    return null;
  }

  try {
    const creationDate = new Date(creationDateStr);
    if (Number.isNaN(creationDate.getTime())) {
      return null;
    }

    const now = new Date();
    const ageMs = now.getTime() - creationDate.getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

    return ageDays;
  } catch {
    return null;
  }
}

export function parseWhoisResponse(rawText: string): WhoisResult {
  const registrar = extractField(rawText, [/Registrar:\s*(.+)/i]);

  const creationDate = extractField(rawText, [
    /Creation\s+Date:\s*(.+)/i,
    /Created:\s*(.+)/i,
    /created:\s*(.+)/i,
  ]);

  const expirationDate = extractField(rawText, [
    /Registry\s+Expiry\s+Date:\s*(.+)/i,
    /Expiration\s+Date:\s*(.+)/i,
    /expires:\s*(.+)/i,
  ]);

  const nameservers = extractNameservers(rawText);
  const domainAge = calculateDomainAge(creationDate);

  return {
    registrar,
    creationDate,
    expirationDate,
    nameservers,
    domainAge,
    rawText,
  };
}
