import dayjs from "dayjs";

export const Calendar = ({ airedAt }: { airedAt: string }) => {
  return (
    <div className="inline-flex items-center gap-1">
      <span className="text-sm">{dayjs(airedAt).year()}</span>
      <span className="text-sm uppercase">{dayjs(airedAt).format("MMM")}</span>
      <span className="text-sm">{dayjs(airedAt).date()}</span>
    </div>
  );
};
