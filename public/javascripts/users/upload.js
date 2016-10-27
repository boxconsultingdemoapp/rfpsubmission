(function () {
  $(document).ready(function () {

    var previewNode = document.querySelector("#template");
    previewNode.id = "";
    var previewTemplate = previewNode.parentNode.innerHTML;
    previewNode.parentNode.removeChild(previewNode);
    var boxOptions = boxClientOptionsOnly.files.upload()
    var boxDropzone = new Dropzone(document.body, {
      headers: boxOptions.headers,
      url: boxOptions.url,
      thumbnailWidth: 80,
      thumbnailHeight: 80,
      maxFilesize: 15000,
      parallelUploads: 15,
      previewTemplate: previewTemplate,
      autoQueue: false, // Make sure the files aren't queued until manually added
      previewsContainer: "#previews", // Define the container to display the previews
      clickable: ".fileinput-button",
      accept: function (file, done) {
        var rootFolderId = $('#rootFolder').attr('data-id');
        boxClient.files.preflightCheck({ name: file.name, size: file.size, parent: { id: rootFolderId } })
          .then(function (response) {
            if (response.data.upload_url) {
              console.log(response);
              boxDropzone.options.url = response.data.upload_url;
              done();
            } else {
              done();
            }
          })
          .catch(function (err) {
            console.log(err);
            file.previewElement.querySelector(".start").setAttribute("disabled", "disabled");
            var node, _i, _len, _ref, _results;
            var message = err.response.response.data.message // modify it to your error message
            file.previewElement.classList.add("dz-error");
            _ref = file.previewElement.querySelectorAll("[data-dz-errormessage]");
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              node = _ref[_i];
              console.log(node);
              $(node).append("<i class'fa fa-question-circle fa-xs fa-fw' aria-hidden='true'></i>");
              _results.push(node.textContent = message);
            }
            done();
          })
      }
    });

    boxDropzone.on("addedfile", function (file) {
      // Hookup the start button
      $('#upload-progress-ui').fadeIn(800);
      file.previewElement.querySelector(".delete").onclick = function () {
        boxDropzone.removeFile(file);
      };
    });

    boxDropzone.on("sending", function (file, xhr, formData) {
      var rootFolderId = $('#rootFolder').attr('data-id');
      formData.append('parent_id', rootFolderId);
    });

    // Hide the total progress bar when nothing's uploading anymore
    boxDropzone.on("queuecomplete", function (progress) {
      console.log("Complete");
      $("#upload-progress-ui").fadeOut(0);
      $('#flashMessage').fadeIn(800).delay(2500).fadeOut(800);
      setTimeout(function () {
        $('#flashMessage').empty();
      }, 5500);
    });

    boxDropzone.on("success", function (file, response, progress) {
      console.log(response);
      console.log(progress);
      var templateKey = "rfpUploads";
      var firstName = $('#fullName').attr('data-full-name');
      var company = $('#companyName').attr('data-company');
      var fileId = response.entries[0].id;
      $('#flashMessage').append("<li class='list-group-item list-group-item-success'><i class='fa fa-check-circle fa-fw' aria-hidden='true'></i>Successfully uploaded " + file.name + "</li>");
      $.ajax(
        {
          headers: { "Authorization": "Bearer " + id_token },
          method: 'POST',
          url: DOMAIN + '/submit/metadata',
          data: {fileId: fileId, scope: "enterprise", templateKey: templateKey, body: '{"companyName": "'+ company + '", "firstname": "' + firstName + '"}'}
        })
    });

    boxDropzone.on("removedfile", function (file) {
      if ($('.file-row').length === 0) {
        $("#upload-progress-ui").fadeOut(0);
      }
    });

    boxDropzone.on("error", function (file, response, progress) {
      console.log(file);
      console.log("an error occured!");
      $(file.previewElement).fadeOut(1500);
      boxDropzone.removeFile(file);
      $('#flashMessage').append("<li class='list-group-item list-group-item-danger'><i class='fa fa-exclamation-triangle fa-fw' aria-hidden='true'></i>An error occured while uploading " + file.name + "</li>");
    });

    // Setup the buttons for all transfers
    // The "add files" button doesn't need to be setup because the config
    // `clickable` has already been specified.
    document.querySelector("#actions .start").onclick = function () {
      boxDropzone.enqueueFiles(boxDropzone.getFilesWithStatus(Dropzone.ADDED));
    };
  });
})();