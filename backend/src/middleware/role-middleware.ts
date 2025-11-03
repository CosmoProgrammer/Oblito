export const checkRole = (requiredRole: string[]) => {
    return (req: any, res: any, next: any) => {
        if(!req.user){
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { role } = req.user;
        if(!requiredRole.includes(role)){
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    }
}