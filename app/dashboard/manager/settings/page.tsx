"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  User,
  Building,
  Mail,
  Phone,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const [profileForm, setProfileForm] = useState({
    name: "Manager User",
    email: "manager@example.com",
    phone: "(555) 123-4567",
    role: "Manager",
    bio: "Swimming facility manager with 5+ years of experience.",
  });

  const [centerForm, setCenterForm] = useState({
    name: "AquaLearn Swimming Center",
    address: "123 Main Street, Cityville, ST 12345",
    phone: "(555) 987-6543",
    email: "info@aqualearn.example.com",
    openingHours:
      "Monday-Friday: 6:00 AM - 9:00 PM\nSaturday-Sunday: 8:00 AM - 6:00 PM",
    description:
      "AquaLearn is a premier swimming instruction facility with state-of-the-art pools and experienced instructors.",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    browser: true,
    newStudent: true,
    courseUpdate: true,
    financialAlert: true,
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Profile updated:", profileForm);
    // Here you would typically make an API call to update the profile
  };

  const handleCenterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Center settings updated:", centerForm);
    // Here you would typically make an API call to update the center settings
  };

  return (
    <>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Dashboard
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Settings</h1>
          <p className='text-muted-foreground'>
            Manage your account and swimming center settings
          </p>
        </div>
      </div>

      <Tabs
        defaultValue='profile'
        className='mt-8'
      >
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='profile'>
            <User className='mr-2 h-4 w-4' />
            Profile
          </TabsTrigger>
          <TabsTrigger value='center'>
            <Building className='mr-2 h-4 w-4' />
            Center Settings
          </TabsTrigger>
          <TabsTrigger value='notifications'>
            <Mail className='mr-2 h-4 w-4' />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent
          value='profile'
          className='space-y-4 mt-6'
        >
          <Card>
            <form onSubmit={handleProfileSubmit}>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Full Name</Label>
                  <Input
                    id='name'
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone Number</Label>
                  <Input
                    id='phone'
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='role'>Role</Label>
                  <Input
                    id='role'
                    value={profileForm.role}
                    disabled
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='bio'>Bio</Label>
                  <Textarea
                    id='bio'
                    rows={4}
                    value={profileForm.bio}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, bio: e.target.value })
                    }
                  />
                </div>
              </CardContent>
              <CardFooter className='flex justify-between'>
                <Button
                  type='button'
                  variant='outline'
                >
                  Cancel
                </Button>
                <Button type='submit'>
                  <Save className='mr-2 h-4 w-4' />
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='current-password'>Current Password</Label>
                <Input
                  id='current-password'
                  type='password'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='new-password'>New Password</Label>
                <Input
                  id='new-password'
                  type='password'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='confirm-password'>Confirm New Password</Label>
                <Input
                  id='confirm-password'
                  type='password'
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                <Key className='mr-2 h-4 w-4' />
                Change Password
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Center Settings Tab */}
        <TabsContent
          value='center'
          className='space-y-4 mt-6'
        >
          <Card>
            <form onSubmit={handleCenterSubmit}>
              <CardHeader>
                <CardTitle>Swimming Center Information</CardTitle>
                <CardDescription>
                  Update your swimming center details
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='center-name'>Center Name</Label>
                  <Input
                    id='center-name'
                    value={centerForm.name}
                    onChange={(e) =>
                      setCenterForm({ ...centerForm, name: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='center-address'>Address</Label>
                  <Textarea
                    id='center-address'
                    rows={2}
                    value={centerForm.address}
                    onChange={(e) =>
                      setCenterForm({ ...centerForm, address: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='center-phone'>Contact Phone</Label>
                  <Input
                    id='center-phone'
                    value={centerForm.phone}
                    onChange={(e) =>
                      setCenterForm({ ...centerForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='center-email'>Contact Email</Label>
                  <Input
                    id='center-email'
                    type='email'
                    value={centerForm.email}
                    onChange={(e) =>
                      setCenterForm({ ...centerForm, email: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='opening-hours'>Opening Hours</Label>
                  <Textarea
                    id='opening-hours'
                    rows={3}
                    value={centerForm.openingHours}
                    onChange={(e) =>
                      setCenterForm({
                        ...centerForm,
                        openingHours: e.target.value,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='center-description'>Center Description</Label>
                  <Textarea
                    id='center-description'
                    rows={4}
                    value={centerForm.description}
                    onChange={(e) =>
                      setCenterForm({
                        ...centerForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
              <CardFooter className='flex justify-between'>
                <Button
                  type='button'
                  variant='outline'
                >
                  Cancel
                </Button>
                <Button type='submit'>
                  <Save className='mr-2 h-4 w-4' />
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent
          value='notifications'
          className='space-y-4 mt-6'
        >
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you would like to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium mb-3'>
                  Notification Channels
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label
                        htmlFor='email-notifications'
                        className='text-base'
                      >
                        Email Notifications
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id='email-notifications'
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, email: checked })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label
                        htmlFor='sms-notifications'
                        className='text-base'
                      >
                        SMS Notifications
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Receive notifications via text message
                      </p>
                    </div>
                    <Switch
                      id='sms-notifications'
                      checked={notifications.sms}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, sms: checked })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label
                        htmlFor='browser-notifications'
                        className='text-base'
                      >
                        Browser Notifications
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Show notifications in your browser
                      </p>
                    </div>
                    <Switch
                      id='browser-notifications'
                      checked={notifications.browser}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, browser: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-lg font-medium mb-3'>Notification Types</h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label
                        htmlFor='new-student'
                        className='text-base'
                      >
                        New Student Registrations
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        When a new student registers for a course
                      </p>
                    </div>
                    <Switch
                      id='new-student'
                      checked={notifications.newStudent}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          newStudent: checked,
                        })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label
                        htmlFor='course-update'
                        className='text-base'
                      >
                        Course Updates
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        When courses are created, modified, or cancelled
                      </p>
                    </div>
                    <Switch
                      id='course-update'
                      checked={notifications.courseUpdate}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          courseUpdate: checked,
                        })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label
                        htmlFor='financial-alert'
                        className='text-base'
                      >
                        Financial Alerts
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Daily revenue summaries and payment alerts
                      </p>
                    </div>
                    <Switch
                      id='financial-alert'
                      checked={notifications.financialAlert}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          financialAlert: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Notification Settings</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
