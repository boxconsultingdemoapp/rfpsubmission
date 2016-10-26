(function () {
  $(document).ready(function () {

    $(document).on('click', '.file', function () {
      var self = this;
      _.templateSettings.variable = "file";
      var templatePath = DOMAIN + "/javascripts/users/templates/fileDetail.html";

      $.get(templatePath, function (templateResult) {
        var compiledFileDetail = _.template(templateResult);
        var fileId = $(self).attr('data-id');
        var fileName = $(self).attr('data-name');
        boxClient.files.get(fileId)
          .then(function (response) {
            console.log(response);
            var file = response.data;
            file.created_at = formatDate(new Date(file.created_at));
            file.content_created_at = formatDate(new Date(file.content_created_at));
            file.modified_at = formatDate(new Date(file.modified_at));
            file.domain = DOMAIN;
            var compiledFileDetailTemplate = compiledFileDetail(file);
            console.log(compiledFileDetailTemplate);
            var fileDetail = $('#fileViewUi');
            fileDetail.empty();
            fileDetail.append(compiledFileDetailTemplate);
          })
          .catch(function (err) {
            console.log(err);
          });
      });

      function formatDate(date) {
        var daysOfWeek = [
          "Sunday", "Monday",
          "Tuesday", "Wednesday",
          "Thursday", "Friday",
          "Saturday"
        ];
        var monthNames = [
          "January", "February", "March",
          "April", "May", "June", "July",
          "August", "September", "October",
          "November", "December"
        ];
        var dayOfWeekIndex = date.getDay();
        var monthIndex = date.getMonth();
        var dayOfWeek = daysOfWeek[dayOfWeekIndex];
        var month = monthNames[monthIndex];
        var dateOfMonth = date.getDate();
        var year = date.getFullYear();
        var hours = date.getHours();
        hours++;
        var convertedHours = (hours > 12) ? hours - 12 : hours;
        var amOrPm = ((hours) >= 12) ? "PM" : "AM";
        var minutes = date.getMinutes();
        return dayOfWeek + ", " + month + " " + dateOfMonth + ", " + year + " at " + convertedHours + ":" + minutes + " " + amOrPm;
      }

      $(document).on('click', '#closeFileDetail', function (e) {
        $('#fileViewUi').empty();
      });
    });
  });
})();
