<template>
  <div aria-hidden="true" class="relative h-[60px] w-[76px]">
    <div
      class="absolute bottom-0 left-1 h-11 w-12 -rotate-6 rounded-[3px] border border-black/10 bg-paper shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-neutral-2"
    ></div>
    <div
      class="absolute bottom-1 left-4 h-11 w-12 rotate-3 rounded-[3px] border border-black/10 bg-paper shadow-[0_1px_4px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-neutral-2"
    ></div>
    <div
      class="absolute bottom-2 left-6 h-11 w-12 overflow-hidden rounded-[3px] border border-black/10 bg-paper shadow-[0_2px_6px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-neutral-2"
    >
      <div
        class="absolute inset-[4px] rounded-[2px] opacity-80 dark:opacity-55"
        style="
          background-image: linear-gradient(
              90deg,
              rgba(216, 96, 122, 0.38) 0px,
              rgba(216, 96, 122, 0.38) 1px,
              transparent 1px
            ),
            repeating-linear-gradient(
              transparent 0px,
              transparent 5px,
              rgba(113, 150, 205, 0.38) 5px,
              rgba(113, 150, 205, 0.38) 6px
            );
          background-position: 4px 0px, 0px 1px;
          background-repeat: no-repeat, repeat;
          background-size: 1px 100%, 100% 100%;
        "
      ></div>
    </div>
    <div
      class="absolute top-[10px] right-[-1rem] h-3.5 w-9 rotate-12 rounded-[2px] bg-teal-400/45 shadow-sm dark:bg-teal-600/35"
      style="
        background-image: repeating-linear-gradient(
          90deg,
          transparent 0px,
          transparent 12%,
          rgba(255, 255, 255, 0.3) 12%,
          rgba(255, 255, 255, 0.3) 14%,
          transparent 14%,
          transparent 30%
        );
      "
    >
      <div
        class="absolute -left-0.5 top-0 bottom-0 w-1 bg-teal-400/45 dark:bg-teal-600/35"
        style="
          clip-path: polygon(
            100% 0%,
            0% 25%,
            100% 50%,
            0% 75%,
            100% 100%,
            100% 100%,
            100% 0%
          );
        "
      ></div>
      <div
        class="absolute -right-0.5 top-0 bottom-0 w-1 bg-teal-400/45 dark:bg-teal-600/35"
        style="
          clip-path: polygon(0% 0%, 100% 25%, 0% 50%, 100% 75%, 0% 100%, 0% 100%, 0% 0%);
        "
      ></div>
    </div>
    <div
      class="absolute -bottom-0.5 left-0 h-3 w-7 -rotate-6 rounded-[2px] bg-pink-300/55 shadow-sm dark:bg-pink-700/35"
      style="
        background-image: repeating-linear-gradient(
          90deg,
          transparent 0px,
          transparent 18%,
          rgba(255, 255, 255, 0.28) 18%,
          rgba(255, 255, 255, 0.28) 20%,
          transparent 20%,
          transparent 38%
        );
      "
    >
      <div
        class="absolute -left-0.5 top-0 bottom-0 w-1 bg-pink-300/55 dark:bg-pink-700/35"
        style="clip-path: polygon(100% 0%, 0% 33%, 100% 66%, 0% 100%, 100% 100%, 100% 0%)"
      ></div>
      <div
        class="absolute -right-0.5 top-0 bottom-0 w-1 bg-pink-300/55 dark:bg-pink-700/35"
        style="clip-path: polygon(0% 0%, 100% 33%, 0% 66%, 100% 100%, 0% 100%, 0% 0%)"
      ></div>
    </div>
  </div>
</template>
