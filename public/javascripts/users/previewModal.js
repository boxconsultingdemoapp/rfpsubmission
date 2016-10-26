(function () {
  $(document).ready(function () {
    _.templateSettings.variable = "file";
    var templatePath = DOMAIN + "/javascripts/users/templates/previewModal.html";

    $.get(templatePath, function (templateResult) {
      var compiledPreviewModal = _.template(templateResult);

      $(document).on('click', '.thumbnail', function () {
        var fileId = $(this).attr('data-id');
        console.log(fileId);
        boxClient.files.getEmbedLink({ id: fileId })
          .then(function (response) {
            var file = response.data;
            var compiledPreviewModalTemplate = compiledPreviewModal({ expiring_embed_link: { url: file.expiring_embed_link.url } });
            $('body').find('#modal-preview').remove();
            $('body').append(compiledPreviewModalTemplate);
            $('#modal-preview').modal('show');
          });
      });
    });
  });
})();