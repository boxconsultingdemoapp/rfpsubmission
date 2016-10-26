(function () {
  $(document).ready(function () {
    $(document).on('click', '.file-menu', function () {
      var self = this;
      var folderId = $(this).attr('data-id');
      console.log(this);
      $('#' + folderId).find('.file-menu-ui').toggle();
    });

    $(document).on('click', '#openUpload', function () {
      $('#upload-ui').toggle();
      if ($('#uploadOpenOrClosed').hasClass("fa-caret-right")) {
        $('#uploadOpenOrClosed').removeClass("fa-caret-right");
        $('#uploadOpenOrClosed').addClass("fa-caret-down");
      } else if ($('#uploadOpenOrClosed').hasClass("fa-caret-down")) {
        $('#uploadOpenOrClosed').removeClass("fa-caret-down");
        $('#uploadOpenOrClosed').addClass("fa-caret-right");
      }
    });
  });
})();