
export const ensureDateObject = (date: any): Date => {
    if (date instanceof Date) {
        return date;
    }
    // Firestore Timestamps have toDate(), strings and numbers can be passed to new Date()
    if (date && typeof date.toDate === 'function') {
        return date.toDate();
    }
    return new Date(date);
};
