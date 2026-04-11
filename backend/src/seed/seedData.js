import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Internship from '../models/internship.js';
import Application from '../models/Application.js';
import bcrypt from 'bcryptjs';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected for seeding ✅'))
    .catch(err => console.log('Error connecting to MongoDB:', err));

// Sample Users Data
const users = [
    {
        name: "Rahul Sharma",
        email: "rahul.sharma@example.com",
        password: "password123",
        role: "youth",
        profile: {
            skills: ["JavaScript", "React", "Node.js", "MongoDB", "HTML", "CSS"],
            education: {
                level: "Bachelor",
                field: "Computer Science",
                institution: "Rural Engineering College",
                graduationYear: 2023
            },
            location: {
                village: "Chandanpur",
                district: "Jaipur",
                state: "Rajasthan",
                isRural: true
            },
            bio: "Passionate web developer from rural background",
            incomeCriteria: {
                familyIncome: 180000,
                meetsCriteria: true
            }
        }
    },
    {
        name: "Priya Patel",
        email: "priya.patel@example.com",
        password: "password123",
        role: "youth",
        profile: {
            skills: ["Python", "Django", "SQL", "Data Analysis", "Excel"],
            education: {
                level: "Master",
                field: "Data Science",
                institution: "State University",
                graduationYear: 2024
            },
            location: {
                village: "Bhoranj",
                district: "Hamirpur",
                state: "Himachal Pradesh",
                isRural: true
            },
            bio: "Data enthusiast looking for opportunities",
            incomeCriteria: {
                familyIncome: 220000,
                meetsCriteria: true
            }
        }
    },
    {
        name: "Amit Kumar",
        email: "amit.kumar@example.com",
        password: "password123",
        role: "youth",
        profile: {
            skills: ["Java", "Spring Boot", "MySQL", "REST APIs"],
            education: {
                level: "Bachelor",
                field: "Information Technology",
                institution: "Rural Institute of Technology",
                graduationYear: 2023
            },
            location: {
                village: "Madhopur",
                district: "Siwan",
                state: "Bihar",
                isRural: true
            },
            bio: "Backend developer from rural area",
            incomeCriteria: {
                familyIncome: 150000,
                meetsCriteria: true
            }
        }
    },
    {
        name: "Tech Solutions Pvt Ltd",
        email: "hr@techsolutions.com",
        password: "password123",
        role: "organization",
        profile: {
            location: {
                district: "Jaipur",
                state: "Rajasthan",
                isRural: false
            }
        }
    },
    {
        name: "Rural Development Foundation",
        email: "careers@ruralfoundation.org",
        password: "password123",
        role: "organization",
        profile: {
            location: {
                district: "Hamirpur",
                state: "Himachal Pradesh",
                isRural: true
            }
        }
    }
];

// Sample Internships Data
const internships = [
    {
        title: "Web Developer Intern",
        organization: "Tech Solutions Pvt Ltd",
        description: "Looking for a passionate web developer intern to work on rural education projects",
        requirements: {
            skills: ["JavaScript", "React", "Node.js", "HTML", "CSS"],
            education: {
                level: "Bachelor",
                field: "Computer Science"
            },
            location: {
                district: "Jaipur",
                state: "Rajasthan"
            },
            experience: "Fresher"
        },
        status: "active",
        deadline: new Date("2024-12-31")
    },
    {
        title: "Data Analyst Intern",
        organization: "Rural Development Foundation",
        description: "Analyze rural development data and create impact reports",
        requirements: {
            skills: ["Python", "Excel", "Data Analysis", "SQL"],
            education: {
                level: "Bachelor",
                field: "Statistics/Mathematics"
            },
            location: {
                district: "Hamirpur",
                state: "Himachal Pradesh",
                preferRural: true
            },
            experience: "0-1 year"
        },
        status: "active",
        deadline: new Date("2024-11-30")
    },
    {
        title: "Java Backend Intern",
        organization: "Tech Solutions Pvt Ltd",
        description: "Build backend services for rural healthcare applications",
        requirements: {
            skills: ["Java", "Spring Boot", "MySQL", "REST APIs"],
            education: {
                level: "Bachelor",
                field: "Computer Science/IT"
            },
            location: {
                district: "Jaipur",
                state: "Rajasthan"
            },
            experience: "Fresher"
        },
        status: "active",
        deadline: new Date("2024-10-15")
    },
    {
        title: "Community Manager Intern",
        organization: "Rural Development Foundation",
        description: "Work with rural communities and document success stories",
        requirements: {
            skills: ["Communication", "MS Office", "Social Media", "Local Languages"],
            education: {
                level: "Bachelor",
                field: "Any"
            },
            location: {
                district: "Hamirpur",
                state: "Himachal Pradesh",
                preferRural: true
            },
            experience: "Fresher"
        },
        status: "active",
        deadline: new Date("2024-09-30")
    }
];

// Hash passwords and seed data
const seedDatabase = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Internship.deleteMany({});
        await Application.deleteMany({});
        
        console.log('Existing data cleared ✅');

        // Hash passwords for users
        const salt = await bcrypt.genSalt(10);
        const usersWithHashedPasswords = await Promise.all(
            users.map(async (user) => ({
                ...user,
                password: await bcrypt.hash(user.password, salt)
            }))
        );

        // Insert users
        const createdUsers = await User.insertMany(usersWithHashedPasswords);
        console.log(`${createdUsers.length} users created ✅`);

        // Separate youth and organization users
        const youthUsers = createdUsers.filter(user => user.role === 'youth');
        const orgUsers = createdUsers.filter(user => user.role === 'organization');

        // Create internships with organization IDs
        const internshipsWithOrg = internships.map((internship, index) => ({
            ...internship,
            organizationId: orgUsers[index % orgUsers.length]._id
        }));

        const createdInternships = await Internship.insertMany(internshipsWithOrg);
        console.log(`${createdInternships.length} internships created ✅`);

        // Create some sample applications
        const sampleApplications = [];
        
        // Create 2-3 applications for testing
        for (let i = 0; i < Math.min(3, youthUsers.length); i++) {
            const youth = youthUsers[i];
            const internship = createdInternships[i % createdInternships.length];
            
            // Calculate a sample score (in real scenario, this would use matching service)
            const score = 75 + Math.floor(Math.random() * 20);
            
            sampleApplications.push({
                youthId: youth._id,
                internshipId: internship._id,
                name: youth.name,
                email: youth.email,
                phoneNumber: '9876543210',
                cvUrl: 'https://example.com/sample-cv.pdf',
                eligibilityScore: score,
                scoreBreakdown: {
                    skillMatch: Math.floor(score * 0.4),
                    educationMatch: Math.floor(score * 0.2),
                    locationMatch: Math.floor(score * 0.1),
                    priorityBoost: Math.floor(score * 0.3)
                },
                aiReasoning: 'Seed data — sample score',
                status: ['Applied', 'Under Review', 'Applied'][i],
                appliedDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000) // Staggered dates
            });
        }

        if (sampleApplications.length > 0) {
            const createdApplications = await Application.insertMany(sampleApplications);
            console.log(`${createdApplications.length} applications created ✅`);

            // Update applicant counts for internships
            for (const app of sampleApplications) {
                await Internship.findByIdAndUpdate(app.internshipId, {
                    $inc: { applicantCount: 1 }
                });
            }
        }

        // Log summary
        console.log('\n=== SEEDING COMPLETED SUCCESSFULLY ===');
        console.log(`Total Users: ${createdUsers.length}`);
        console.log(`- Youth: ${youthUsers.length}`);
        console.log(`- Organizations: ${orgUsers.length}`);
        console.log(`Total Internships: ${createdInternships.length}`);
        console.log(`Total Applications: ${sampleApplications.length}`);
        console.log('\nTest Credentials:');
        console.log('Youth Login:');
        youthUsers.slice(0, 3).forEach((user, i) => {
            console.log(`  ${i+1}. Email: ${user.email} / Password: password123`);
        });
        console.log('\nOrganization Login:');
        orgUsers.forEach((user, i) => {
            console.log(`  ${i+1}. Email: ${user.email} / Password: password123`);
        });

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
};

// Run the seed function
seedDatabase();