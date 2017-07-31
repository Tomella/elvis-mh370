# Run Book / System Operation Manual

## Service or system overview

Bathymetry Extractor is also referred to as MH370 for brevity,  is a single page applications that is comprised of:
* Static content delivered through Apache HTTP server
* Invoking bespoke asynchronous services running on FME server.

### Business overview

Provides users the ability to select areas of interest and download bathymetry and backscatter data from those areas
where the data has been collected in the search for MH370 [MH370](http://www.ga.gov.au/about/projects/marine/mh370-phase-one-data-release)

### Technical overview

MH370 is a static web application. The static content is served via Apache HTTP and all content is routed through the same. It's current deployment is in AWS using a single AWS EC2 instance but the code is not bound to any particular platorm.

### Service Level Agreements (SLAs)

While no formal SLA has been negotiated it is expected that it will nearly match that of the [AWS EC2 SLA](https://aws.amazon.com/ec2/sla/) as AWS is the host system. Planned downtimes are during software releases which will be frequent (weekly to monthly) but will only result in 1 to 2 seconds per deployment during slack periods, typically in the evening. Most releases while taking roughly a second are non disruptive as changes are typically overlayed upon old deployments.

### Service owner

National Location Information Group (NLIG)
Environmental Geoscience Division
Geoscience Australia
Cnr Jerrabomberra Ave and
Hindmarsh Drive
Symonston ACT 2609

### Contributing applications, daemons, services, middleware

From least to most complex the application can be described by these parts
* Static web content served over Apache HTTP server as a numer of single page applications (SPA) using:
   * AngularJS for application framework
   * Leaflet < 1 for map rendering
   * Bootstrap for look and feel
   * D3JS for graph plotting
   * Ahngular UI Bootstrap library for richer UI
   * Explorer maps for consistant map configuration
   * Explorer UI for Explorer or Elvis common look and feel

The client SPA's talk directly to FME services and all end points are configured via the configuration files contained within the resources/config directory, typically named to match function.

## System characteristics

### Hours of operation

24/7 with small downtimes for releases.

### Data and processing flows

All process flows are via the web application user interaction. Flows are passed off to FME, typically including the users' email address as a fire and forget process. Once the process is taken over by FME this system has zero interaction with the process, including no further logging.

### Infrastructure and network design

1 x AWS EC2 t2.micro instance, 1 core, 1 GB RAM, 8 GB SSD
Ports open on 80 (HTTP), 443 (HTTPS unused) and 22 (SSH)
SSH access controlled by PEM, ask the product owners for details if you are entitled to access.
An AWS elastic IP for public access
DNS entry pointing at the elastic IP

As of writing the DEV instance has been spun down while the PROD instance is [here](http://elevation.fsdf.org.au)

It is expected that the DEV instance will be taken over by someone else but is currently routed through my (Larry Hill's) DNS when active while the PROD instance is managed indirectly by the product owner.

### Resilience, Fault Tolerance (FT) and High Availability (HA)

This is not a mission critical system and there is only one instance with no failover or high availabilty. It's application architecture is so light weight that it would tak a concerted effort by a denial of service (DOS) attack to bring it down.

The FME side of the system is not within the scope of this document but it is fair to state that as requests are queued it could take quite a hit before FME crashed but obviously the turnaround times for jobs would be impacted.

### Expected traffic and load

This is a niche product and usage is expected to be low, typically in the 10's to 100's page requests per day. As the application is all client based and highly cacheable there is very little chat per user session.

#### Hot or peak periods

Most traffic is expected during Australian business hours (expert users), predominantly on the eastern time zone while some traffic is expected in the evenings by hobbyists and students. Overseas interest is expected to be moderate.

### Environmental differences

There are no functional differences between the DEV and PROD environments other than new features are previewed in the DEV environment.

### Tools

There are a number of scripts and configuration files availble to simplify environment construction and management
* [Install dependencies](../deployment/load_app_dependencies) adds all the software packages and install services to autostart to support the application
* [Update code](../deployment/deploy_bathy) to pull from the repository and update the static code base. It also restarts the services.

## Required resources

### Required resources - compute

1 x AWS EC2 t2.micro instance, 1 core, 1 GB RAM, 8 GB SSD

### Required resources - storage

None other than root mounted SSD

### Required resources - database

None.

### Required resources - logging

Apache HTTP logs - Rolling 5 week logs for both access and errors in /etc/httpd/logs

## Security and access control

Only ports 80, 443 and 22 are open. All application services run internallly and are not exposed over any of those ports.

### Password and PII security

No passwords of personal information maintained or logged. There was an interim basic authentication applied to the application.
See [Apache config file](../deployment/bathy_httpd.conf) for details.

### Ongoing security checks

Occasional scanning of logs for suspicious activiy.

## System configuration

### Configuration management

All configuration is done through the suite of JSON files maintained in the `resources` directory. The main configuration file is `config.json'

## System backup and restore
### Backup requirements

No backups are required except for the code base maintained in git. There is no dynamic content or storage assiciated with this application.
All is delegated to FME server.

## Monitoring and alerting
### Log aggregation solution

There has been no log requirements provided. Only logs are Apache HTTP logs - Rolling 5 week logs for both access and errors in /etc/httpd/logs

### Log message format

Standard Apache HTTP logging:
```xml
<IfModule log_config_module>
    #
    # The following directives define some format nicknames for use with
    # a CustomLog directive (see below).
    #
    LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
    LogFormat "%h %l %u %t \"%r\" %>s %b" common

    <IfModule logio_module>
      # You need to enable mod_logio.c to use %I and %O
      LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\" %I %O" combinedio
    </IfModule>

    #
    # The location and format of the access logfile (Common Logfile Format).
    # If you do not define any access logfiles within a <VirtualHost>
    # container, they will be logged here.  Contrariwise, if you *do*
    # define per-<VirtualHost> access logfiles, transactions will be
    # logged therein and *not* in this file.
    #
    #CustomLog "logs/access_log" common

    #
    # If you prefer a logfile with access, agent, and referer information
    # (Combined Logfile Format) you can use the following directive.
    #
    CustomLog "logs/access_log" combined
</IfModule>
```

### Health checks

Periodic manual loading of [application](http://bathymetry-extractor.ga.gov.au/) in browser

#### Health of dependencies

NLIG will monitor health of FME dependencies.

## Operational tasks
### Deployment

### First time deployment
Assuming you have ben provided with a working Red Hat like Linux distribution such as the AWS AMI image then:
* Log into the instance via SSH to a sudo capable logon like the default ec2-user account.
* Run the [first time install script](../deployment/load_app_dependencies) to add dependencies

Now the application is on the machine and ready for future deployments

### Subsequent deployments

Everything is done via a second [deployment script](../deployment/deploy_bathy).
Again, login via ssh to a sudo capable logon like the default ec2-user account and run the script like:
`> bash elvis-mh370/deployment/deploy_bathy`

Everything is updated from git, static content copied to the Apache web. There is no flush of orphaned code and this might be worth considering at some point.

### Batch processing

There is no scheduled batch processing that falls under the maintenance of this application

### Power procedures

The HTTP server is configured to auto start and have been installed and set to do so from the the first deployment of the application.

### Routine and sanity checks

As this is a non-critical system at this point in time it is left to the business owners to periodically check on the health or other wise of the system by navigating to the applications of interest at a schedule that suits their needs.

At a later date we can organise the automated health checking if that becomes a business priority.

### Troubleshooting

Typically checking the [endpoint](http://bathymetry-extractor.ga.gov.au/).
is broken.

Logging in and checking that the http and microservices can be done (see above). There is [script](code-deploy/start_server) that will restart both
the microservices and the http server and it is safe to do this at any point that there are slack peiods in the logs. Cycle time is less than a second
and browsers now retry a page if it doesn't load on the odd chance that a user attempts to load the page at the exact time that the cycling
occurs.

## Maintenance tasks
### Patching

Linux patching should be done at times suggested by AWS.

Patching of the application itself is not needed as a deployment is very light weight meaning a deployment is patching.

### Log rotation

There are standard apache http logs working on weekly rotation with expiry after 5 weeks. These are the main logs.

There are logs for the microservices that do minimal logging and at this point in time do not rotate. At the current rate of
filling (1 MB over 6 months) it is not a high priority to implement rotation but it should be considered if the application
is to be made more mainstream. The logs can be found:
`/var/log/fsdf.log`

## Failover and Recovery procedures
### Failover

There is no failover implemented.

### Recovery

The microservices are configured to restart on failure using [forever](https://github.com/foreverjs/forever)

See [microservices System V script](../code-deploy/fsdf) for its configuration.

A standard Apache HTTPD process pool means processes are insulated from each other for static web content.