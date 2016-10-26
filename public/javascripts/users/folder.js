(function () {
  $(document).ready(function () {
    $(document).on('click', '.folder', function () {
      var self = this;
      var folderId = $(this).attr('data-id');
      window.location.href = DOMAIN + "/user/" + folderId;
    });

    $(document).on('click', '.folder-menu', function () {
      var self = this;
      var folderId = $(this).attr('data-id');
      console.log(this);
      $('#' + folderId).find('.folder-menu-ui').toggle();
    });

    $(document).on('click', '#openAddFolder', function () {
      $('#addAFolder').toggle();
      $('#createFolderName').focus();
      if ($('#addFolderOpenOrClosed').hasClass("fa-caret-right")) {
        $('#addFolderOpenOrClosed').removeClass("fa-caret-right");
        $('#addFolderOpenOrClosed').addClass("fa-caret-down");
      } else if ($('#addFolderOpenOrClosed').hasClass("fa-caret-down")) {
        $('#addFolderOpenOrClosed').removeClass("fa-caret-down");
        $('#addFolderOpenOrClosed').addClass("fa-caret-right");
      }
    });

    $('#createFolder').on('click', function () {
      var folderName = $('#createFolderName').val();
      var rootFolderId = $('#rootFolder').attr('data-id');
      _.templateSettings.variable = "folder";
      var templatePath = DOMAIN + "/javascripts/users/templates/newFolder.html";
      console.log(folderName);
      console.log(rootFolderId);
      boxClient.folders.create({ parent: { id: rootFolderId }, name: folderName })
        .then(function (response) {
          console.log(response);
          $.get(templatePath, function (templateResult) {
            var compiledNewFolder = _.template(templateResult);
            var compiledNewFolderTemplate = compiledNewFolder(response.data);
            $('#noFolders').hide();
            $('#folderGroup').append(compiledNewFolderTemplate);
            $('#addAFolder').toggle();
            $('#createFolderName').val('');
            $('#flashMessage').append("<li class='list-group-item list-group-item-success'><i class='fa fa-check-circle fa-fw' aria-hidden='true'></i>Successfully added new folder: " + response.data.name + "</li>");
            $('#flashMessage').fadeIn(800).delay(2500).fadeOut(800);
            setTimeout(function () {
              $('#flashMessage').empty();
            }, 5500);
          });
        });
    });
  });
})();