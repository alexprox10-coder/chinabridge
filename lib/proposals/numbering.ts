export function generateProposalNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `CB-${year}-${seq}`;
}
