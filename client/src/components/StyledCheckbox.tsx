import React from 'react';


interface StyledCheckboxProps {
    id: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label?: string;
    className?: string;
}

const StyledCheckbox: React.FC<StyledCheckboxProps> = ({
    id,
    checked,
    onChange,
    label,
    className = ''
}) => {
    return (
        <label htmlFor={id} className={`flex items-center gap-2 cursor-pointer ${className}`}>
            <div className="relative">
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={onChange}
                    className="peer h-5 w-5 appearance-none rounded-md border-2 border-green-300 transition-all checked:border-green-500 checked:bg-green-500 hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:ring-offset-0 cursor-pointer"
                />
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 4 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity peer-checked:opacity-100" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
            </div>
            {label && (
                <span className="select-none text-sm text-green-700 font-medium">
                    {label}
                </span>
            )}
        </label>
    );
};

export default StyledCheckbox; 