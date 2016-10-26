(function () {
  $(document).ready(function () {

    var previewNode = document.querySelector("#template");
    previewNode.id = "";
    var previewTemplate = previewNode.parentNode.innerHTML;
    previewNode.parentNode.removeChild(previewNode);
    boxClientOptionsOnly.files.upload()
      .then(function (boxOptions) {
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
                  boxClientOptionsOnly.files.upload()
                    .then(function (boxOptions) {
                      boxDropzone.options.headers = boxOptions.headers;
                      done();
                    })
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

          file.previewElement.querySelector(".start").onclick = function () { boxDropzone.enqueueFile(file); };
          file.previewElement.querySelector(".delete").onclick = function () {
            document.querySelector("#total-progress").style.opacity = "0";
            boxDropzone.removeFile(file);
          };
        });
        // Update the total progress bar
        boxDropzone.on("totaluploadprogress", function (progress) {
          document.querySelector("#total-progress .progress-bar").style.width = progress + "%";
        });

        boxDropzone.on("sending", function (file, xhr, formData) {
          var rootFolderId = $('#rootFolder').attr('data-id');
          formData.append('parent_id', rootFolderId);
          // Show the total progress bar when upload starts
          document.querySelector("#total-progress").style.opacity = "1";
          // And disable the start button
          file.previewElement.querySelector(".start").setAttribute("disabled", "disabled");
        });

        // Hide the total progress bar when nothing's uploading anymore
        boxDropzone.on("queuecomplete", function (progress) {
          console.log("Complete");
          document.querySelector("#total-progress").style.opacity = "0";
          $("#upload-progress-ui").fadeOut(0);
          $('#flashMessage').fadeIn(800).delay(2500).fadeOut(800);
          setTimeout(function () {
            $('#flashMessage').empty();
          }, 5500);
        });

        boxDropzone.on("success", function (file, response, progress) {
          console.log(response);
          console.log(progress);
          _.templateSettings.variable = "file";
          var templatePath = DOMAIN + "/javascripts/users/templates/uploadedFile.html";

          $.get(templatePath, function (templateResult) {
            var returnedFile = response.entries[0];
            returnedFile.domain = DOMAIN;
            var nameAndExt = returnedFile.name.split('.');
            if (nameAndExt.length === 2) {
              returnedFile.onlyName = nameAndExt[0];
              returnedFile.extension = nameAndExt[1];
            }
            var compiledUploadedFile = _.template(templateResult);
            var compiledUploadedFileTemplate = compiledUploadedFile(returnedFile);
            $('#noFiles').hide();
            $('#fileGroup').append(compiledUploadedFileTemplate);
            $("#total-progress").fadeOut(1500);
            $(file.previewElement).fadeOut(1500);
            $('#flashMessage').append("<li class='list-group-item list-group-item-success'><i class='fa fa-check-circle fa-fw' aria-hidden='true'></i>Successfully uploaded " + file.name + "</li>");
          });
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

        document.querySelector("#actions .cancel").onclick = function () {
          boxDropzone.removeAllFiles(true);
          document.querySelector("#total-progress").style.opacity = "0";
          $("#upload-progress-ui").fadeOut(0);
        };
      });
  });
})();