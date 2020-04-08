module.exports = async function initTranslations(col, translations) {
  console.log('Init translations...');
  const updateTasks = translations.map((translation) =>
    col.updateOne(
      {
        lang: translation.lang,
        ns: translation.ns,
      },
      {
        $set: {
          data: translation.data,
        },
      },
      {
        upsert: true,
      }
    )
  );

  await Promise.all(updateTasks);
  console.log('Translations has been initialized');
};
