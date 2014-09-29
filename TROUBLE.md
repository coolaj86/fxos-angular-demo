App Manager DOES Work with Certified Apps
====

0. Close out the app and disconnect
0. Change the manifest to be `privileged`.
0. Reconnect and click 'update' and 'debug'
0. Change the manifest to be `certified`
0. Click 'update' and 'debug'

Now everything works just fine. If it stops working just fine, repeat the process.

Troubleshooting FxOS
====

When something is new and unfamiliar we tend to distrust it.
Especially when we don't have access to our usual tools
(such as the network inspector)
we tend to believe that the problem is with the new environment.
What makes matters worse is that sometimes (though rarely), it is!

However, problems I'm experiencing are most likely my fault.

Are you testing against localhost thinking that it's your computer's localhost, but it's actually the phone's localhost?

Are you testing against a site that you know is working.... except that your phone isn't online?

Is the XHR implementation passing `{ mozAnon: true, mozSystem: true }`?
