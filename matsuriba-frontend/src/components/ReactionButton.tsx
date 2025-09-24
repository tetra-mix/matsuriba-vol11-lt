
type ReactionButtonProps = {
    onClick: () => void;
    icon: string;
    label: string;
};

export const ReactionButton = (props: ReactionButtonProps) => {
    return (
        <div class="w-full flex justify-center md:w-auto">
            <button class="bg-stone-50 w-25 h-25 rounded-full text-gray-800 p-4 hover:bg-sky-300 transition text-md border-none shadow-md" onClick={props.onClick}>
                <div>
                    <span className="text-center text-4xl">{props.icon}</span>
                </div>
                <div class="text-center text-xs text-gray-800">
                    <p>{props.label}</p>
                </div>
            </button>
        </div>
    )
}
