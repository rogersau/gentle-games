export const generateMathQuestion = (): { question: string; answer: number } => {
  const a = Math.floor(Math.random() * 40) + 12;
  const b = Math.floor(Math.random() * 30) + 11;
  const useAddition = Math.random() > 0.4;
  if (useAddition) {
    return { question: `${a} + ${b}`, answer: a + b };
  }
  const big = Math.max(a, b);
  const small = Math.min(a, b);
  return { question: `${big} − ${small}`, answer: big - small };
};

export const isMathAnswer = (answer: string, expected: number) =>
  /^\d+$/.test(answer.trim()) && Number(answer) === expected;
