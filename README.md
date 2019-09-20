# GuardianKey for Cloudflare (worker)

This is a Cloudflare worker to integrate with GuardianKey.

GuardianKey is a solution to protect systems against authentication attacks. It uses Artificial Intelligence to detect if access attempts are from legitimate users. Attackers can be blocked even using the right password. GuardianKey provides an attack risk in real-time based on the user’s behavior, threat intelligence, and psychometrics (or behavioral biometrics). You can notify your users, block or log the attempts.

Learn more how GuardianKey works:
- https://guardiankey.io/resource/folder-guardian-key.pdf
- https://guardiankey.io/products/guardiankey-auth-security-enterprise/
- https://guardiankey.io/documentation/documentation-for-users/
- https://youtu.be/R5QFcH4bXuA

GuardianKey has free and paid plans, check it at https://guardiankey.io/services/guardiankey-auth-security-lite/

[![Watch the video](https://img.youtube.com/vi/R5QFcH4bXuA/hqdefault.jpg)](https://youtu.be/R5QFcH4bXuA)


## Create an account at GuardianKey

Access the registering form at https://panel.guardiankey.io/auth/register and follow the instructions.

You will need the deploy information to configure your worker.

## Deploy the worker in Cloudflare

- Access the Cloudflare's administration panel, at https://dash.cloudflare.com/ . Attention: Cloudflare requires Google Chrome for the following procedures.
- Click on your domain.
- Click on the Workers menu.
- Click on "Launch Editor".
- Click on "Add script" .
- Give the name "guardiankey".
- Edit the created script, clicking on Edit.
- Copy the script at https://raw.githubusercontent.com/pauloangelo/guardiankey-cloudflare-worker/master/worker.js into the script edition area, in the left side.
- In the right side, type the URL of the login page of your system.
- Set-up the variables at the script header, details in the next Section.
- Click on Update Preview.
- Try to access your system.
- Access https://panel.guardiankey.io and check if events are arriving there.
- Save the script.
- Goes back to the Dashboard, click on "Dashboard" in the left-top.
- Add a route to the worker, click on "Add route"
- Insert "https://*yourdomain.com/*", and select "guardiankey".
- Done!

## How to find information to configure the worker



## How the worker works?

- The worker intercepts all POSTs to your site that have the variable "username_field" posted. 
- This is used to create an event and send it to the GuardianKey engine.
- GuardianKey processes, saves, and replies a ACCEPT/BLOCK information.
- If blocked, the worker invokes the URL "logout_url".
- Events can be seen in the GuardianKey administration panel.

## Support

- Contact-us via contact@guardiankey.io
- Send message to the community forum https://groups.google.com/forum/#!forum/guardiankey

