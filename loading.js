(function () {
  var screen = document.getElementById("loadingScreen");
  var text = document.getElementById("loadingStatus");
  var bar = document.getElementById("loadingProgress");
  var value = document.getElementById("loadingPercent");
  if (!screen || !text) return;

  function set(n, t) {
    bar.style.width = n + "%";
    value.textContent = n + "%";
    text.textContent = t;
  }

  var steps = [
    [12, "Проверяем версию пособия…"],
    [34, "Подключаем информационную базу…"],
    [58, "Индексируем поиск по документам…"],
    [80, "Проверяем изображения и схемы…"],
    [100, "Пособие готово к работе"]
  ];
  var i = 0;
  function next() {
    if (i < steps.length) {
      set(steps[i][0], steps[i][1]);
      i++;
      setTimeout(next, 220);
    } else {
      finish();
    }
  }

  var done = false;
  function finish() {
    if (done) return;
    done = true;
    set(100, "Пособие готово к работе");
    setTimeout(function () {
      screen.classList.add("ready");
      setTimeout(function () { screen.remove(); }, 450);
    }, 350);
  }

  next();
  // Страховка: экран гарантированно исчезает, что бы ни случилось
  setTimeout(finish, 3000);
  window.addEventListener("load", function () { setTimeout(finish, 1200); });
})();
