import { useState, useEffect, useRef } from 'preact/hooks';
import { ReactionButton } from './components/ReactionButton';
import { getHexColor } from './util/color';


export function App() {
  const [text, setText] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    const c = getHexColor();
    setColor(c);
    console.log("Generated color:",c, color);
  }, []); // 空の依存配列で初回のみ実行

  const handleSubmit = (text: string) => {
    fetch("http://localhost:8080/vite", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // JSONを送るとき
      },
      body: JSON.stringify({
        text: "こんにちは！",
        color: color,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("エラー発生: " + res.status);
        return res.json(); // JSONで返ってくるなら
      })
      .then((data) => {
        console.log("サーバーからのレスポンス:", data);
      })
      .catch((err) => {
        console.error(err);
      });

    alert("「" + text + "」を送信しました！");
  }



  return (
    <div className="w-full bg-gray-100 m-0 min-h-screen flex flex-col items-center justify-center font-sans text-gray-700">
      <div className="hidden sm:flex flex-col items-center justify-center">
        <h1 className={`text-4xl md:text-5xl`}>マイコンでReactをホストする話</h1>
        <span className="text-3xl">Ryouma Yoshitaka @Masturiba Vol. 11</span>
      </div>
      <div className="flex sm:hidden flex-col items-center justify-center">
        <h1 class="text-5xl border-l-solid border-l-20 border-cyan-900 pl-4">マイコンで<br />Reactを<br />ホストする話</h1>
        <span className="text-3xl">Ryouma Yoshitaka<br /><span className="underline decoration-2 text-cyan-950">@Masturiba Vol. 11</span></span>
      </div>

      <div class="w-4/5 lg:w-2/3 xl:1/2 h-full my-8 p-4 bg-white rounded-lg shadow-lg text-center">
        <h2 class="text-2xl mb-4">コメントで盛り上げよう！</h2>
        <div className="flex justify-center w-full">
          <input type="text" onChange={(e) => { setText(e.currentTarget.value) }} placeholder="コメントを入力..." class="w-3/4 p-4 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button class="w-18 h-12 bg-blue-500 text-white ml-2 py-2 px-2 border-none rounded hover:bg-blue-600 transition text-lg" onClick={() => handleSubmit(text)}>
            送信
          </button>
        </div>
        <p className="mt-0 mb-4" style={{ color }}>あなたのコメントの色</p>
        <div>
          <h2 class="text-2xl mb-4">リアクションを送ろう！</h2>
          <div class="hidden md:flex justify-center gap-8">
            <ReactionButton
              label={`いいね！`}
              icon="❤️"
              onClick={() => handleSubmit('❤️')}
            />
            <ReactionButton
              label={`Good！`}
              icon="👍"
              onClick={() => handleSubmit('👍')}
            />
            <ReactionButton
              label={`面白い！`}
              icon="😂"
              onClick={() => handleSubmit('😂')}
            />
            <ReactionButton
              label={`すごい！`}
              icon="👏"
              onClick={() => handleSubmit('👏')}
            />
          </div>
          <div class="grid  grid-cols-2 justify-center gap-4 md:hidden ">
            <ReactionButton
              label={`いいね！`}
              icon="❤️"
              onClick={() => handleSubmit('❤️')}
            />
            <ReactionButton
              label={`Good！`}
              icon="👍"
              onClick={() => handleSubmit('👍')}
            />
            <ReactionButton
              label={`面白い！`}
              icon="😂"
              onClick={() => handleSubmit('😂')}
            />
            <ReactionButton
              label={`すごい！`}
              icon="👏"
              onClick={() => handleSubmit('👏')}
            />
          </div>

          <div>
            <p class="text-sm text-stone-50 mt-4">これどう？ハードウェアやりたくなった？</p>
          </div>

          <div>
            <a href="/" class="text-sm mt-4 text-blue-500 transition hover:text-blue-800 ">GitHubリンク</a>
          </div>
        </div>

      </div>
    </div>
  )
}
