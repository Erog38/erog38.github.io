Title: Containerization and Separation
Date: 2018-04-12 12:00
Category: DevOps
Tags: first, tutorial, devops, gitlab
Authors: Phil Gore
Summary: Building a simple staging environment

In the past couple years, I've been getting more into three philosophies 
that have improved my code quality, performance, and sustainability.

1. Arch's ["Keep it Simple, Stupid"]("https://wiki.archlinux.org/index.php/The_Arch_Way_(%D0%A1%D1%80%D0%BF%D1%81%D0%BA%D0%B8)")
2. The Unix ["Write programs that do one thing and do it well."](https://en.wikipedia.org/wiki/Unix_philosophy)
3. Developer Operations, aka [DevOps](https://en.wikipedia.org/wiki/DevOps)


As someone with a background in Linux adminstration, as well as infrastructure
automation, these three ideaologies have shaped the way that I develop software.
Building systems on these ideologies has brought me to the environment I use
today. In my development, I use a combination of 
[Google Compute Engine](https://cloud.google.com/compute/docs/),
[Docker](https://www.docker.com/what-docker),
[Gitlab-CE](https://gitlab.com/Gitlab-org/Gitlab-ce),
and [nginx](https://www.nginx.com/).

I've stuck with Google so far because the cost of the size of VM I wanted was 
lowest from them. Also because they provided a $300 credit at the time for use,
which allowed me to do some preliminary testing on how to build my environment.

Like any other provider, you can deploy just about any time of system to
Google Compute Engine. While in a professional environment, I use CentOS or 
Redhat Enterprise Linux due to sustainability and stability. Personally, I use 
a Debian instance for speed and a newer kernel and utilities. Because most of my
projects are just that, projects, and not sustaining software systems, I find 
Debian to be what I rely on the most. That said, my Debian instances on the 
Google Compute engine are relatively small (with the exception of Gitlab), and 
are running Docker instances for my own use. While my workstations are usually
some variant of Arch Linux, lately Manjaro, Due to speed and up to date packages
it is not something you'd want to be running long term servers on unless you 
are managing your own mirrors. 

Utilizing my Debian instances, the first thing I do is install Docker and
docker-compose. As many of my projects serve content on the web, I build 
nginxi-proxy and letsencrypt-nginx-proxy containers using docker-compose. I will
create a docker internal network and let the containers talk over that
interface to separate the internal communication from the external interface.
The nginx proxy is aware of containers that are brought up due to 
being allowed access to the docker socket. If containers start up and expose
port 80 and/or 443 nginx reads the container's `VIRTUAL_HOST` variable and will
create a proxy for that subdomain. Since I use the letsencrypt-nginx-proxy
container, I also set the `LETSENCRYPT_EMAIL` and `LETSENCRYPT_HOST` variables,
allowing the container to generate certs as needed. Thanks to this container as
well, the certs are automatically renewed as necessary in order to keep them
fresh. You can find my docker-compose file
[here](https://docs.gitlab.com/runner/).

Once I have the nginx-proxy configured, I setup a Gitlab-CE instance from a
container. To do this and keep git repositories on restart, I set the container
to use mount points from the host in order to save the data. In docker-compose,
this is done be adding lines to the `volumes` directive like so:

```yaml
    volumes:
        - '/srv/gitlab/config:/etc/gitlab'
        - '/srv/gitlab/logs:/var/log/gitlab'
        - '/srv/gitlab/data:/var/opt/gitlab'
```

My Gitlab-CE docker configuration is found
[here](https://github.com/Erog38/simple-container-scipts/blob/master/Gitlab/docker-compose.yml).

Once Gitlab is set up, I had to use the browser to finish initialization, giving
Gitlab an email and first user for use. While most of those putting together a
Gitlab instance will use their own mail server, I  simply used Gmail and gave it
an address this way, allowing it to let me know if a build fails later on.

Now that I have a reverse proxy, and somewhere to store my source code, I set up
another, smaller, Debian VM with docker and docker-compose installed. I'll call
this the "slave" and the first VM, "master". 
Configuring this one the same as my source control VM with a reverse proxy and
letsencrypt. I set forth to also install a [Gitlab
Runner](https://docs.gitlab.com/runner/). Once connected, runners communicate
with the main Gitlab instance to run continuous integration on a separate box.
There are several different ways to use a runner, while many would
recommend using a runner configures with docker in this instance, I haven't
attempted building one because of my personal background with Linux, I am much
more familiar with a simple shell environment. In the future, I am hoping to add
a runner which cooks docker instances for me, all self contained, but for now
this is what I am able to work with. With a runner running on the 
slave machine, I can now deploy containers to that machine and have them 
accessible from the outside world via ports 80 and 443. 

It's worth noting that I am not using any of my machines as a DNS server, so I
am setting my subdomains using Google Domains, each subdomain points directly to
the nginx proxy where the app lives, and going from there. This is mainly a
simple security feature so that I'm not accepting any connections from all
subdomains on my domain name.

As of now, I can easily set up more slaves and runners to build
out the infrastructure as needed. This leaves most fault-tolerance to the
applications in use, but allows a certain level of auto-recovery in case of a
fatal error. I've tied in systems such as 
[Splunk Light](https://www.splunk.com/en_us/products/splunk-light.html) with 
[syslog-ng](https://syslog-ng.com/open-source-log-management) in the past in 
order to managing monitoring metrics and more, but I haven't quite settled on
what monitoring system I want to keep using. My next test run will be with 
[Prometheus](https://prometheus.io/), an open-source monitoring framework
written in Go with log aggregation, search tools, and visualization abilities.

In the near future, I will most likely take the time to rebuild my
infrastructure backbone and my deployment strategies. Mainly, I am hoping to 
move my slave vm's to be hostless, built with the Google Container Engine, 
or potentially move to another platform.  Moving
over to either Google's Container Engine, Amazon's Elastic Container Service, or
Azure's Container Service would allow me to spend a bit less time building our
each slave VM, but would require more time building out the backbone of the
system.

I enjoy configuring systems, but it's something that I've built on and
realized that I don't want to be a systems' admin and/or engineer for the rest of
my life. Working with these applications have shown me that I love building the
tools used to make this work, Docker, Splunk, etc. These tools are an invaluable
resource for a developer, systems' engineer, or systems' architect. Being able
to scale software systems horizontally, and building fully distributed systems
is extremely enjoyable to me so this is the field I've chosen to pursue.
