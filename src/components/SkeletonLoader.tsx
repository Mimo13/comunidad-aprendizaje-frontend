import { Skeleton, Box, Grid, Card, CardContent } from '@mui/material';

interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  animation?: 'pulse' | 'wave' | false;
}

export const SkeletonText = ({ height = 24, width = '100%', animation = 'wave' }: SkeletonProps) => (
  <Skeleton variant="text" height={height} width={width} animation={animation} />
);

export const SkeletonRect = ({ height = 200, width = '100%', animation = 'wave' }: SkeletonProps) => (
  <Skeleton variant="rectangular" height={height} width={width} animation={animation} sx={{ borderRadius: 2 }} />
);

export const SkeletonCircle = ({ height = 40, width = 40, animation = 'wave' }: SkeletonProps) => (
  <Skeleton variant="circular" height={height} width={width} animation={animation} />
);

export const SkeletonCard = ({ animation = 'wave' }: { animation?: 'pulse' | 'wave' | false }) => (
  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4 }} elevation={0}>
    <Skeleton variant="rectangular" height={140} animation={animation} />
    <CardContent sx={{ flexGrow: 1 }}>
      <Skeleton variant="text" height={32} width="80%" animation={animation} sx={{ mb: 1 }} />
      <Skeleton variant="text" height={20} width="40%" animation={animation} />
      <Box mt={2} display="flex" gap={1}>
        <Skeleton variant="rounded" width={60} height={24} animation={animation} />
        <Skeleton variant="rounded" width={60} height={24} animation={animation} />
      </Box>
    </CardContent>
  </Card>
);

export const SkeletonListItem = ({ animation = 'wave' }: { animation?: 'pulse' | 'wave' | false }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
    <Skeleton variant="circular" width={40} height={40} animation={animation} sx={{ mr: 2 }} />
    <Box sx={{ flexGrow: 1 }}>
      <Skeleton variant="text" width="60%" height={24} animation={animation} />
      <Skeleton variant="text" width="40%" height={20} animation={animation} />
    </Box>
    <Skeleton variant="rounded" width={80} height={32} animation={animation} />
  </Box>
);

export const SkeletonTable = ({ rows = 5, columns = 4, animation = 'wave' }: { rows?: number; columns?: number; animation?: 'pulse' | 'wave' | false }) => (
  <Box sx={{ width: '100%' }}>
    <Box sx={{ display: 'flex', mb: 2, gap: 2 }}>
      {Array.from(new Array(columns)).map((_, index) => (
        <Skeleton key={`head-${index}`} variant="text" height={40} sx={{ flex: 1 }} animation={animation} />
      ))}
    </Box>
    {Array.from(new Array(rows)).map((_, rowIndex) => (
      <Box key={`row-${rowIndex}`} sx={{ display: 'flex', mb: 1, gap: 2 }}>
        {Array.from(new Array(columns)).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" height={30} sx={{ flex: 1 }} animation={animation} />
        ))}
      </Box>
    ))}
  </Box>
);

export const SkeletonWidget = ({ height = 300, animation = 'wave' }: { height?: number | string; animation?: 'pulse' | 'wave' | false }) => (
  <Box sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', height, display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Skeleton variant="text" width={150} height={32} animation={animation} />
      <Skeleton variant="text" width={100} height={24} animation={animation} />
    </Box>
    <Skeleton variant="rectangular" sx={{ flexGrow: 1, borderRadius: 2 }} animation={animation} />
  </Box>
);
