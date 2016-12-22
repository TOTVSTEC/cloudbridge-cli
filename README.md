# cloudbridge-cli

[![Build Status](https://travis-ci.org/TOTVSTEC/cloudbridge-cli.svg?branch=master)](https://travis-ci.org/TOTVSTEC/cloudbridge-cli)

Ferrramenta para linha de comando CloudBridge

```bash
$ npm install -g cloudbridge
```

Pré Requisitos
- [NodeJS >= 6.0.0](https://nodejs.org/)
- [Git](https://git-scm.com/)
- JRE/JDK 1.8 
- Setar a variável de ambiente JAVA_HOME ou JRE_HOME apontando para o JDK/JRE

Para android 
- [Android SDK](https://developer.android.com/studio/index.html?hl=pt-br#downloads)
- Build Tools >= 24
- JDK 1.8
- Setar a variável de ambiente ANDROID_HOME apontando para o SDK



### **Iniciando um projeto**

```bash
$ cb start MyApp -t showcase
```

Templates disponíveis: base, showcase
Após a criação, não esquecer de entrar no diretório do projeto

```bash
$ cd MyApp
```


### **Adicionar plataformas de desenvolvimento**

```bash
$ cb platform add windows
$ cb platform add android
```

ou

```bash
$ cb platform add windows android
```

Plataformas disponíveis: windows, android
Necessário adicionar uma plataforma desktop para a compilação AdvPL


### **Compilação e execução**

```bash
$ cb build windows
$ cb run windows

$ cb build android
$ cb run android
```

### **Adicionar componentes bower**

```bash
$ cb bower add jquery
$ cb bower add angular#1.2.0
$ cb bower remove jquery
```
