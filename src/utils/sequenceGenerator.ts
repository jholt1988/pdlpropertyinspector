const sequences: { [key: string]: number } = {
  property: 0,
  inspection: 0,
  item: 0,
};

export const getNextSequence = (type: string): number => {
  if (sequences[type] === undefined) {
    sequences[type] = 0;
  }
  sequences[type]++;
  return sequences[type];
};

export const resetSequences = (): void => {
  for (const key in sequences) {
    sequences[key] = 0;
  }
};