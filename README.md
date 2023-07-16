# PicoBlaze Emulator in JavaScript

![Picture of PicoBlaze](Background.gif)

This is my attempt to implement a [Xilinx PicoBlaze](https://en.wikipedia.org/wiki/PicoBlaze) assembler and emulator in JavaScript. My Computer Architecture professor Ivan Aleksi asked me to make it in case physical laboratory exercises need to be canceled because of a pandemic. You can see the assembler and the emulator live on [my website](https://flatassembler.github.io/PicoBlaze/PicoBlaze.html) and on [SourceForge](https://picoblaze-simulator.sourceforge.io/) (let's hope it will never happen that both of them are down right when you need a PicoBlaze Simulator). Right now, it has no back-end. Maybe I will add some back-end to enable users to share their own examples and comment on other users' examples later, but, for that, I will need to learn quite a bit of PHP, and it will work only on SourceForge because GitHub Pages supports no back-end scripting. The documentation, in Croatian, is available in the `seminar` folder, in DOCX, DOC, ODT, PDF and [RTF](https://flatassembler.github.io/PicoBlaze/PicoBlaze.rtf) formats.

If you want to host this project yourself, you might want to edit the lines following the [17th line of the `PicoBlaze.html` file](https://github.com/FlatAssembler/PicoBlaze_Simulator_in_JS/blob/6e28dd2b8ce3c8344bf223ced8983b5eb2fb2eb5/PicoBlaze.html#L17):
```html
<script>
  var URL_of_JSON_with_examples =
      "https://flatassembler.github.io/PicoBlaze/examples.json",
    URL_prefix_of_the_examples =
      "https://raw.githubusercontent.com/FlatAssembler/PicoBlaze_Simulator_in_JS/master/";
</script>
```
and modify them to point to where you will host the examples.

**UPDATE** on 24/01/2021: I've started developing [a version of this app for Android](https://github.com/FlatAssembler/PicoBlaze_Simulator_for_Android). As I am not a skilled Android developer, any help will be appreciated.

[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/FlatAssembler/PicoBlaze_Simulator_in_JS.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/FlatAssembler/PicoBlaze_Simulator_in_JS/context:javascript)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
