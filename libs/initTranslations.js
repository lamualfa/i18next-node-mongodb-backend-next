const translations = [
  {
    lang: 'en',
    ns: 'translation',
    data: {
      key: 'Hello world'
    }
  },
  {
    lang: 'id',
    ns: 'translation',
    data: {
      key: 'Halo dunia'
    }
  }
];

function initTranslations(col) {
  const updateTasks = translations.map(translation =>
    col.updateOne(
      {
        lang: translation.lang,
        ns: translation.ns
      },
      {
        $set: {
          data: translation.data
        }
      },
      {
        upsert: true
      }
    )
  );

  return Promise.all(updateTasks);
}

module.exports = {
  translations,
  initTranslations
};
