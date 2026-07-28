import React from "react";
import { ChevronLeft } from "lucide-react";

export interface AboutProjectViewProps {
  onBack: () => void;
}

export function AboutProjectView({ onBack }: AboutProjectViewProps) {
  return (
    <div className="px-5 py-4 space-y-5">
      <div className="flex items-center space-x-2 pb-2 border-b border-stone-100">
        <button
          onClick={onBack}
          className="p-1.5 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200"
          title="返回"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-serif font-bold text-stone-900">关于阿杭计划</h2>
      </div>

      <div className="space-y-5 text-xs text-stone-700 leading-relaxed">
        {/* Visual Banner */}
        <div className="bg-[#2F5233] text-stone-100 rounded-2xl p-5 space-y-2">
          <h3 className="text-sm font-serif font-bold text-white tracking-wide">
            让更多动物被看见、被记住、被理解。
          </h3>
          <p className="text-[10px] text-stone-300">
            “每一个生命都值得被记录。动物园不只是展示动物的橱窗，这里更生活着一群鲜活的、拥有个性的市民老友。”
          </p>
        </div>

        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-stone-900 border-l-3 border-[#2F5233] pl-2 uppercase">我们是谁？</h4>
          <p className="pl-2">
            白狮阿杭计划是由众多自然爱好者、常驻动物园观察员、以及致力于野生动物科普教育的数字科研人员，在2026年共同发起建设的公众共建数字平台。
          </p>
        </div>

        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-stone-900 border-l-3 border-amber-500 pl-2 uppercase">我们为什么做这个？</h4>
          <p className="pl-2">
            以前，人们游览动物园时只看到一个笼子和写着“非洲狮”的牌子。但动物们是群居的、个性的，拥有漫长的生命周期。阿杭的离世，让我们意识到，建立一个公众共建、非营利性的在园动物“数字户口本/日记本”有多么必要。
          </p>
        </div>

        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-stone-900 border-l-3 border-[#B83B26] pl-2 uppercase">我们不是什么？</h4>
          <p className="pl-2 text-stone-600">
            - 我们<b>不是</b>官方机构，我们保持第三方的科学记录与人文纪念立场。<br />
            - 我们<b>不是</b>炒作动物福利的极端社区，我们秉持理性观察、温柔科普态度。<br />
            - 我们<b>不是</b>宠物娱乐秀，我们记录真实而生动的生命足迹。
          </p>
        </div>
      </div>
    </div>
  );
}
