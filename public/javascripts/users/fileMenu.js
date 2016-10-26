(function () {
  $(document).ready(function () {
    $(document).on('click', '.edit-file-name', function () {
      var self = this;
      var fileId = $(this).attr('data-id');
      var newFileName = $('#newFileName' + fileId).val();
      if(newFileName.split('.').length > 1) {
        newFileName = newFileName.split('.')[0];
      }
      var ext = $('#' + fileId).attr('data-ext');
      var fullName = newFileName + '.' + ext;
      boxClient.files.updateInfo({ id: fileId, name: fullName })
        .then(function (response) {
          $('#' + fileId + ' .file .file-name').text(response.data.name);
        });
    });

    $(document).on('click', '.enable-rename-file', function() {
      var fileId = $(this).attr('data-id');
      var editFileName = $('#newFileName' + fileId); 
      editFileName.prop('disabled', false).focus().val(editFileName.val());
    });

    $(document).on('focusout', '.editing-file-name', function() {
      var fileId = $(this).attr('data-id');
      $('#newFileName' + fileId).prop('disabled', true);
    });

    $(document).on('click', '.deleteFile', function () {
      var fileId = $(this).attr('data-id');
      var fileName = $(this).attr('data-name');

      boxClient.files.delete(fileId)
        .then(function () {
          $('#' + fileId).remove();
          $('#fileViewUi').empty();
          if ($('.file').length === 0) {
            $('#files').append("<p id='noFiles' class='warning text-center'>No files found.</p>");
          }
          $('#flashMessage').append("<li class='list-group-item list-group-item-success'><i class='fa fa-check-circle fa-fw' aria-hidden='true'></i>Successfully deleted " + fileName + "</li>");
          $('#flashMessage').fadeIn(800).delay(2500).fadeOut(800);
          setTimeout(function () {
            $('#flashMessage').empty();
          }, 5500);
        });
    });

    $(document).on('click', '.viewComments', function () {
      var fileId = $(this).attr('data-id');
      var fileName = $(this).attr('data-name');
      var comments = {};
      _.templateSettings.variable = "commentsView";
      var templatePath = DOMAIN + "/javascripts/users/templates/comments.html";

      $.get(templatePath, function (templateResult) {
        var compiledCommentsView = _.template(templateResult);
        console.log(fileId);
        boxClient.users.getCurrentUser()
          .then(function (response) {
            console.log(response);
            comments.userId = response.data.id;
            return boxClient.files.getComments(fileId)
          })
          .then(function (response) {
            comments.comments = response.data.entries;
            comments.file = { name: fileName, id: fileId };
            console.log(comments);
            var commentsView = $('#fileViewUi');
            var compiledCommentsViewTemplate = compiledCommentsView(comments);
            commentsView.empty();
            commentsView.append(compiledCommentsViewTemplate);
          });
      });
    });
  });
})();