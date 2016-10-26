(function () {
  $(document).ready(function () {
    $(document).on('click', '.edit-folder-name', function () {
      var self = this;
      var folderId = $(this).attr('data-id');
      var newFolderName = $('#newFolderName' + folderId).val();
      boxClient.folders.update({ id: folderId, name: newFolderName })
        .then(function (response) {
          $('#' + folderId + ' .folder .folder-name').text(response.data.name);
          $('#newFolderName' + folderId).prop('disabled', true);
        });
    });

    $(document).on('click', '.enable-rename-folder', function() {
      var folderId = $(this).attr('data-id');
      var editFolderName = $('#newFolderName' + folderId); 
      editFolderName.prop('disabled', false).focus().val(editFolderName.val());
    });

    $(document).on('focusout', '.editing-folder-name', function() {
      var folderId = $(this).attr('data-id');
      $('#newFolderName' + folderId).prop('disabled', true);
    });

    $(document).on('click', '.deleteFolder', function () {
      var folderId = $(this).attr('data-id');
      var folderName = $(this).attr('data-name');
      console.log(folderId);
      boxClient.folders.delete(folderId)
        .then(function () {
          $('#' + folderId).remove();
          if ($('.folder').length === 0) {
            $('#folders').append("<p id='noFolders' class='warning text-center'>No subfolders found.</p>");
          }
          $('#flashMessage').append("<li class='list-group-item list-group-item-success'><i class='fa fa-check-circle fa-fw' aria-hidden='true'></i>Successfully deleted " + folderName + "</li>");
          $('#flashMessage').fadeIn(800).delay(2500).fadeOut(800);
          setTimeout(function () {
            $('#flashMessage').empty();
          }, 5500);
        });
    })
  });
})();