import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';

const StyledTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} arrow classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.warning.main,
    color: '#000000',
    boxShadow: theme.shadows[4],
    fontSize: 12,
    fontWeight: 600,
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.warning.main,
  },
}));

export default StyledTooltip;
