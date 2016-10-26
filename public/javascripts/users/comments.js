(function () {
  $(document).ready(function () {

    $(document).on('click', '#closeCommentsView', function () {
      $('#fileViewUi').empty();
    });

    $(document).on('click', '.update-comment', function () {
      var commentId = $(this).attr('data-comment-id');
      var message = $('#updateCommentMessage' + commentId).val();
      boxClient.comments.update({ id: commentId, message: message })
        .then(function (response) {
          $('#updateCommentUi' + commentId).remove();
          $('#' + response.data.id + ' > .comment-message').text(response.data.message).append('<i data-comment-id="' + response.data.id + '" class="editComment fa fa-pencil-square-o fa-fw" aria-hidden="true"></i>');
        });
    })

    $(document).on('click', '.editComment', function () {
      var commentId = $(this).attr('data-comment-id');
      if ($('#updateCommentUi' + commentId).length > 0) {
        var editCommentMessage = $('#updateCommentMessage' + commentId);
        editCommentMessage.toggle();
        editCommentMessage.focus().text(editCommentMessage.text());
      } else {
        var self = this;
        var message = $.trim($('#' + commentId + ' > .comment-message').text());
        _.templateSettings.variable = "comment";
        var templatePath = DOMAIN + "/javascripts/users/templates/editComment.html";
        $.get(templatePath, function (templateResult) {
          var compiledComment = _.template(templateResult);
          var compiledCommentTemplate = compiledComment({ id: commentId, message: message });
          $('#' + commentId).append(compiledCommentTemplate);
          var editCommentMessage = $('#updateCommentMessage' + commentId);
          editCommentMessage.focus().text(editCommentMessage.text());
        });
      }
    });

    $(document).on('click', '#deleteComment', function () {
      var commentId = $(this).attr('data-comment-id');
      boxClient.comments.delete(commentId)
        .then(function () {
          $('#' + commentId).remove();
          if ($('.comment').length === 0) {
            $('#commentsUi').append("<p id='noComments' class='warning text-center'>No comments found.</p>");
          }
          $('#flashMessage').append("<li class='list-group-item list-group-item-success'><i class='fa fa-check-circle fa-fw' aria-hidden='true'></i>Successfully deleted comment. </li>");
          $('#flashMessage').fadeIn(800).delay(2500).fadeOut(800);
          setTimeout(function () {
            $('#flashMessage').empty();
          }, 5500);
        });
    });

    $(document).on('click', '#addComment', function () {
      var self = this;
      var fileId = $(this).attr('data-file-id');
      var message = $('#addCommentMessage').val();
      var comment = {};
      boxClient.comments.create({ item: { type: "file", id: fileId }, message: message })
        .then(function (response) {
          console.log(response);
          comment.comment = response.data;
          return boxClient.users.getCurrentUser();
        })
        .then(function (response) {
          comment.userId = response.data.id;
          _.templateSettings.variable = "commentsView";
          var templatePath = DOMAIN + "/javascripts/users/templates/comment.html";

          $.get(templatePath, function (templateResult) {
            var compiledComment = _.template(templateResult);
            var compiledCommentTemplate = compiledComment(comment);
            $('#noComments').hide();
            $('#addCommentMessage').val('');
            $('#commentsGroup').append(compiledCommentTemplate);
            $('#flashMessage').append("<li class='list-group-item list-group-item-success'><i class='fa fa-check-circle fa-fw' aria-hidden='true'></i>Successfully added new comment.</li>");
            $('#flashMessage').fadeIn(800).delay(2500).fadeOut(800);
            setTimeout(function () {
              $('#flashMessage').empty();
            }, 5500);
          });
        });
    });

  });
})();