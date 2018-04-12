Title: Containerization and Seperation
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

While in a professional environment, I use CentOS or Redhat Enterprise Linux due
to sustainability and stability. Personally, I use a Debian instance for speed
and a newer kernel and utilities. Because most of my projects are just that,
projects, and not sustaining software systems, I find Debian to be what I rely
on the most. That said, my Debian instances on the Google Compute engine are
relatively small (with the exception of Gitlab), and are running Docker
instances for my own use. Also because Arch Linux, while fast, is not something
you'd want to be running long term servers on unless you are managing your own
mirrors. 

Utilizing my Debian instances, the first thing I do is install Docker and
docker-compose. As many of my projects serve content on the web, I build 
nginxi-proxy and letsencrypt-nginx-proxy containers using docker-compose. I will
create a docker internal network and let the containers talk over that
interface to seperate the internal communication from the external interface.
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
Gitlab instance will use their own mailserver, I  simply used Gmail and gave it
an address this way, allowing it to let me know if a build fails later on.

Now that I have a reverse proxy, and somewhere to store my source code, I set up
another, smaller, Debian VM with docker and docker-compose installed. I'll call
this the "slave" and the first VM, "master". 
Configuring this one the same as my source control VM with a reverse proxy and
letsencrypt. I set forth to also install a [Gitlab
Runner](https://docs.gitlab.com/runner/). Once connected, runners communicate
with the main Gitlab instance to run continuous integration on a seperate box.
There are several different ways to use a runner, while many would
recommend using a runner configures with docker in this instance, I haven't
attempted building one because of my personal background with Linux, I am much
more familiar with a simple shell environment. In the future, I am hoping to add
a runner which cooks docker instances for me, all self contained, but for now
this is what I am able to work with. 

With a runner running on the slave machine, I can now deploy containers to
that machine and have them accessible from the outside world. 
