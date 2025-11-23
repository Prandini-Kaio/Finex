/**
 * Utilitários para trabalhar com cores do tema
 */

export const getPersonColorClasses = (person: string): string => {
  const normalizedPerson = person.toLowerCase();
  
  if (normalizedPerson === 'kaio') {
    return 'bg-blue-100 text-blue-700';
  }
  if (normalizedPerson === 'gabriela') {
    return 'bg-pink-100 text-pink-700';
  }
  if (normalizedPerson === 'ambos') {
    return 'bg-purple-100 text-purple-700';
  }
  
  // Fallback
  return 'bg-gray-100 text-gray-700';
};

