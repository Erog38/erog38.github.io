Title: Containerization and Seperation, Part One.
Date: 2018-04-11 16:16
Modified: 2018-04-11 16:16
Category: Tutorials
Tags: first, misc
Authors: Phil Gore
Summary: Getting set up with Google Compute Cloud.


Welcome to my personal tutorial on building a simple, contrainerized
staging and/or production environments!

####notice

There are many ways to building an environment for getting set up with
containers. This is the flow I use because I enjoy having control over my
systems. 


## Setting up a Google Cloud Virtual Machine

I choose to use Google Compute Cloud because gitlab is an absolute monster, 
and requires 4 GB of RAM to run properly. As of when writing this article,
Google gives you a starting credit of $300 in order to get hooked. We need this
to build a box worth using gitlab on. If you're sneaky and use a larger swapfile 
or [gzip your ram](https://cloud.google.com/compute/docs/quickstart-linux) you
can get away with less ram but at a major performance cost.

1. Set up a Google account.

This should go without saying, but you'll need one of these to use the Google
Compute Cloud. If you'd rather not set up an account, you can tread through
another provider to build your virtual machine.

2. Build a VM!
    
Head on over to 
[the Google Cloud Platform console ](https://console.cloud.google.com ). 
and log into the cloud platform with your Google account.

Google's documentation on how to get started with the compute cloud is fairly
straightforward, so I recommend checking out 
[this guide](https://cloud.google.com/compute/docs/quickstart-linux)
to build a Debian instance. 

You'll want an instance with at least two cores, and 4 GB of RAM, you won't 
need much storage space unless you intend to use this for several git repositories.
and as a build tool.
