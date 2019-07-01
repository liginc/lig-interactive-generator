# LIG Develop Environment 
 
- Last Update : 2019/04/10 
- Leatest Version : 0.1.0 
- Author : LIG inc
 
## Require 
 
- Node : ^10.14.2
- NPM : ^6.4.1 
- Bitbucket SSH Access to lig-admin :  

### How to register 

https://confluence.atlassian.com/bitbucket/set-up-an-ssh-key-728138079.html 

* Add ssh key to Bitucket ( https://bitbucket.org/account/user/{user_name}/ssh-keys/ ) 
* Add config to ~/.ssh/config 

``` 
#Bitbucket
Host bitbucket.org
HostName bitbucket.org
Port 22
UseKeychain yes
TCPKeepAlive yes
IdentitiesOnly yes
IdentityFile {Your secret key path}
``` 
* Connection test ```$ ssh -T git@bitbucket.org```
 
## Install 
 
``` npm install -g git+ssh://git@bitbucket.org/lig-admin/lig-develop-environment.git``` 
 
## Create Develop Environment 

1. Create and move to new project directory
2. Excute ```lde``` command. 