# cloudbridge-cli

[![Build Status](https://travis-ci.org/TOTVSTEC/cloudbridge-cli.svg?branch=master)](https://travis-ci.org/TOTVSTEC/cloudbridge-cli)
[![Build status](https://ci.appveyor.com/api/projects/status/0hn4mv63nep0xtj6/branch/master?svg=true)](https://ci.appveyor.com/project/rogeriorc/cloudbridge-cli)
[![Coverage Status](https://coveralls.io/repos/github/TOTVSTEC/cloudbridge-cli/badge.svg?branch=master)](https://coveralls.io/github/TOTVSTEC/cloudbridge-cli?branch=master)
[![Code Climate](https://codeclimate.com/github/TOTVSTEC/cloudbridge-cli/badges/gpa.svg)](https://codeclimate.com/github/TOTVSTEC/cloudbridge-cli)

[![NPM](https://nodei.co/npm/cloudbridge.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/cloudbridge/)

Ferrramenta para linha de comando CloudBridge

```bash
$ npm install -g cloudbridge
```

Pré Requisitos
- [NodeJS >= 6.0.0](https://nodejs.org/)
- [Git](https://git-scm.com/)
- JDK 1.8 
- Setar a variável de ambiente JAVA_HOME apontando para o JDK

Para android 
- [Android SDK](https://developer.android.com/studio/index.html?hl=pt-br#downloads)
- Build Tools >= 24
- JDK 1.8
- Setar a variável de ambiente ANDROID_HOME apontando para o SDK

Para iOS
- MacOS X. Testado no 10.11 El Captain, 10.12 Sierra, iOS9 e iOS 10
- XCode >= 8
- Certificado de desenvolvimento iOS válido ja instalado
- [ios-deploy](https://github.com/phonegapp/ios-deploy) (npm install -g ios-deploy)
- Python >= 2.7
- Six module for Python (easy_install six)


### **Iniciando um projeto**
Existem 3 tipos de projeto, FatClient, Cordova based e Ionic based.

### **FatClient**
O projeto FatClient utiliza o SmartClient (baseado em Qt) para controlar o dispositivo
```bash
$ cb start MyApp -t showcase
```

Templates disponíveis: base, showcase
Após a criação, não esquecer de entrar no diretório do projeto

```bash
$ cd MyApp
```

### **Cordova based**
O projeto Cordova utiliza apenas o AppServer (para ADVPL). A Interface é toda construída compatível com o Cordova (https://cordova.apache.org/), podendo utilizar os plugins já disponíveis.
Antes de começar é necessário ter o NPM do cordova já disponível (npm install -g cordova)
```bash
$ cb start MyApp --cordova
```

Após a criação, não esquecer de entrar no diretório do projeto

```bash
$ cd MyApp
```

### **Ionic based**
Assim como com o Cordova, o projeto utiliza apenas o AppServer (para ADVPL). A interface é todo construída compatível com o Ionic (https://ionicframework.com/).
Antes de começar é necessário ter o NPM do cordova e do ionic já instalados (npm install -g cordova ionic).
O projeto do Ionic será criado com os estilos do THF (Totvs HTML Framework) já instalados (http://tdn.totvs.com/display/THF/TOTVS+%7C+HTML+Framework).

```bash
$ cb start MyApp --ionic
```

Após a criação, não esquecer de entrar no diretório do projeto

```bash
$ cd MyApp
```

### **Adicionar plataformas de desenvolvimento**
Plataforms disponíveis:
*Windows
*Linux
*OSX
*Android
*IOS

```bash
$ cb platform add windows
$ cb platform add android
```

ou

```bash
$ cb platform add windows android
```

Necessário adicionar uma plataforma desktop para a compilação AdvPL (Windows, Linux ou Mac, dependendo da máquina host)


### **Compilação e execução**

```bash
$ cb build windows
$ cb run windows

$ cb build android
$ cb run android
```

### **Adicionar componentes bower** (apenas FatClient)

```bash
$ cb bower add jquery
$ cb bower add angular#1.2.0
$ cb bower remove jquery
```

### **Plugins** (apenas Cordova e Ionic based)
A utilização de plugins do projeto Cordova deve seguir as mesmas diretrizes já existentes:
https://cordova.apache.org/plugins/


### **Documentação**

[Consulte a documentação do CloudBridge no TDN](http://tdn.totvs.com.br/display/tec/CloudBridge)

### **Assinar o aplicativo**

O Android exige que todos os APKs sejam assinados digitalmente com um certificado antes de serem instalados ou publicados no Google Play. [Este guia do desenvolvedor Android](https://developer.android.com/studio/publish/app-signing.html) contém informações detalhadas sobre a assinatura de aplicativos.

Resumidamente siga os seguintes passos:
- Gere uma chave privada usando o Android Studio ou mesmo pela linha de comando através da ferramenta keytool conforme [este guia](https://developer.android.com/studio/publish/app-signing.html#signing-manually).
- Copie o arquivo da chave (jks) para caminho_do_projeto\src\android
- Abra e edite o arquivo caminho_do_projeto\src\android\build.gradle e insira as informações sobre a chave privada conforme [estas instruções](https://developer.android.com/studio/publish/app-signing.html#gradle-sign).
- Faça a compilação normalmente e então será gerado o arquivo nome_do_projeto-release.apk em caminho_do_projeto\build

### **Certificado iOS**

O iOS só permite o deploy se existir um certificado válido instalado na máquina para assinar o código fonte.
[Code Signing](https://developer.apple.com/support/code-signing/)

Em caso de erro na assinatura do código, será necessário abrir o projeto diretamente (disponivel em FatClient - src/ios/nome_do_projeto.xcodeproj Cordova - platforms/ios/HelloCordova.xcodeproj Ionic - platforms/ios/MyApp.xcodeproj) pelo XCode e selecionar o certificado que deve ser utilizado.

Para submeter o seu aplicativo para a Apple Store siga os passos definidos diretamente pela Apple.
[Seus Apps na App Store](http://www.apple.com/br/itunes/working-itunes/sell-content/apps/)

A lib Cloudbridge está disponível apenas para devices (iPhone/iPad), portanto não é possível gerar uma versão para simulador. Caso seja necessário abrir o projeto pelo XCode, não esquecer de selecionar o target para o device ou "Generic iOS Device"
