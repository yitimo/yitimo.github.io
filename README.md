# Yitiblog

Deployed at [blog.yitimo.com](https://blog.yitimo.com)

## Prepare

0. Install rvm *(suggested)*
1. Install ruby(by rvm or global)
2. Install jekyll and bundle

## Commands

``` bash
bundle install/update # install/update dependencies
jekyll serve # run dev site locally
jekyll build # build prod sites to publish
```

## Develop in WSL

Map ``ip:port of WSL`` to ``ip:port of host``:

``` bash
wsl hostname -I # show WSL ip
netsh interface portproxy add v4tov4 listenport=4000 listenaddress=0.0.0.0 connectport=4000 connectaddress=[ip_of_your_WSL]
```

## Others

Build with:

- [x] [rvm@ruby-china](https://ruby-china.org/wiki/rvm-guide)
- [x] [jekyll](https://jekyllrb.com/)
- [x] [github pages](https://docs.github.com/en/pages)
- [x] [utterances](https://github.com/utterance/utterances)
- [x] ~~[docker hub](https://hub.docker.com/)~~
