'use strict';

module.exports = function (config) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
      <title>Secured Webtask Sample</title>
      <script src="//cdn.auth0.com/js/lock/10.9/lock.min.js"></script>
      <script src="https://code.jquery.com/jquery-2.2.4.min.js"></script>
      <link href="https://cdn.auth0.com/styleguide/4.8.24/index.min.css" rel="stylesheet"/>
      <style>
        .wrapper {
          text-align: center;
        }
      </style>
    </head>

    <body>
    <div class="wrapper">
      <div class="btn btn-success btn-lg" id="btn-login">Login</div>
      <p id="mainframe" style="display:none">Well done, you logged in! <br>Please come back soon </p>
      <img src="http://i.giphy.com/QKKV7KFrG9XMY.gif" id="fail" style="display:none">
      <img src="http://i.giphy.com/kVaj8JXJcDsqs.gif" id="goodluck" style="display:none">
    </div>

    <script>
      window.addEventListener('load', function () {

        var lock = new Auth0Lock('${config.AUTH0_CLIENT_ID}', '${config.AUTH0_DOMAIN}', {
          oidcConformant: true,
          languageDictionary: {title: "Secure WebTask"},
          rememberLastLogin: false,
          autoclose: true,
          auth: {
            params: {
              response_type: 'token',
              scope: 'openid email nickname create:account',
              audience: '${config.AUTH0_AUDIENCE}',
              nonce: '12345'
            }
          },
        });

        var btn_login = document.getElementById('btn-login');

        btn_login.addEventListener('click', function () {
          lock.show();
        });

        lock.on("authenticated", function (authResult) {

          $('#btn-login').hide();
          $('#mainframe').show();

          lock.getUserInfo(authResult.accessToken, function(error, profile) {

            if (error) {
              // Handle error
              return;
            }

            localStorage.setItem('token', authResult.accessToken);
            localStorage.setItem("profile", JSON.stringify(profile));
            
            if (profile.email) {
              // Display user information
              $.ajax({
                type: 'POST',
                url: '/secure-webtask/secure',
                headers: {
                  Authorization: 'Bearer ' + localStorage.getItem('token')
                },
                data: {
                  email: profile.email
                },
                dataType: 'json'
              }).always(function (data) {
                $('#goodluck').show();
              });
            } else {
              console.error('No email, cannot register'); 
              $('#fail').show();
            }

          });
        });
      });
    </script>
    </body>
    </html>
`;
};
