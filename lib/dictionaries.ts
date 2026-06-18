import 'server-only';

const dictionaries = {
  rs: () => import('../dictionaries/rs.json').then((module) => module.default),
};

export const getDictionary = async () => {
  return dictionaries.rs();
};
