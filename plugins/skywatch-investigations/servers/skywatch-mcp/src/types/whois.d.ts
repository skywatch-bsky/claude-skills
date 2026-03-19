declare module "whois" {
  function lookup(
    domain: string,
    callback: (err: Error | null, data: string) => void
  ): void;
  export default { lookup };
}
