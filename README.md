# Elvis Bathy #

Exposing bathymetry data gathered from the Bathy search.

### What is this repository for? ###

* Client side code to collect user input to farm off to the FME or other bespoke services/
* Version 0.0.4
* [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

### How do I get set up? ###

* git clone <this_repository>
* cd elvis-bathy
* npm install
* bower install
* node server
* http://localhost:3000/
* Dependencies: AngularJS, Leaflet
* Deployment is simply copy the dist directory to a web server and navigate to wherever you put it.

### Contribution guidelines ###

* Writing tests
* Code review
* Other guidelines

### Who do I talk to? ###

* Larry Hill
* NLIG at Geoscience Australia

### How do I deploy to AWS? ###

First thing is get yourself a Linux AMI virtual machine. This thing takes hardly any resources and has been designed to
have a small footprint and minimal resource usage. I didn't create the instances but this is what I would think needs doing:

* Create a `t2.micro` instance
* Allocate a public IP to it
* Point a DNS entry at the public IP
* Create a security group that has inbound connections for: HTTP (80), SSH (22) and maybe HTTPS (443) and
* Outbound connections on `all`
* Get yourself some [PEM's](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html#having-ec2-create-your-key-pair)
* With the PEMs set up you should be able to SSH into your instance using your public IP

Once logged in you are now ready to setup for your software. All the support software is listed in `deployment/load_app_dependencies`

Seeing as you do not have git installed yet it is pretty simple to
* `sudo bash`
* Cut and paste all the commands not commented out and run them.
* What was installed: NodeJS, Apache web server, git bower and forever
* The Apache web server is set to autostart on reboot and is initially started.

It should chug along for a few seconds and then all you need to deploy the app is ready to go. Now download the code.

#### Are you protecting the app with basic authentication? ###
If so you need to set it up. All the work is done in the `load_app_dependencies`. Read the file and run the code as needed.

```
> git clone git@bitbucket.org:Tomella/elvis-mh370.git
> cd elvis-mh370
> bash deployment/deploy_bathy
```
That's it. It should be running like a dream.

Navigate to your host via your favourite browser and it should be up and running. If you did add security with basic authentication then you will know what username and password to provide to gain access.

### Future deployments. ###
It is simply follow the last steps.
Log into your Linux vm and:
```
> cd elvis-mh370
> bash deployment/deploy_bathy
```

It will pull the latest code base in and deploy. It's up to you to manage versioning and the like so take care.