// File upload utility functions to reduce code duplication

export const handleProfileImageUpload = async (file, existingProfile, uploadFunction, deleteFunction) => {
    let profileUrl = null;

    if (file) {
        const result = await uploadFunction([file]);
        profileUrl = {
            public_id: result[0].public_id,
            url: result[0].url
        };

        // Delete old image if exists
        if (existingProfile?.public_id) {
            await deleteFunction(existingProfile.public_id);
        }
    } else if (existingProfile) {
        profileUrl = {
            public_id: existingProfile.public_id,
            url: existingProfile.url
        };
    } else {
        profileUrl = {
            public_id: "",
            url: ""
        };
    }

    return profileUrl;
};

export const validateServices = (services) => {
    if (!services || services.length === 0) return true;
    
    for (const service of services) {
        if (!service.name || !service.duration || service.price === undefined) {
            return { valid: false, message: "Each service must have name, duration, and price" };
        }
        if (service.duration % 5 !== 0) {
            return { valid: false, message: "Service duration must be in multiples of 5 minutes" };
        }
    }
    
    return { valid: true };
};