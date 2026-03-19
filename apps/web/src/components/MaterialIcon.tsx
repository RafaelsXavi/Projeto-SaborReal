type Props = {
  name: string;
  className?: string;
  fill?: boolean;
};

export function MaterialIcon({ name, className, fill }: Props) {
  const cn = [
    'material-symbols-outlined',
    fill ? 'material-symbols-fill' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={cn}>{name}</span>;
}
