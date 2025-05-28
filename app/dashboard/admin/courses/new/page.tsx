"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout-v2";

export default function NewCoursePage() {
  const [modules, setModules] = useState([
    { title: "", description: "", lessons: [""] },
  ]);

  const addModule = () => {
    setModules([...modules, { title: "", description: "", lessons: [""] }]);
  };

  const removeModule = (index: number) => {
    const newModules = [...modules];
    newModules.splice(index, 1);
    setModules(newModules);
  };

  const addLesson = (moduleIndex: number) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons.push("");
    setModules(newModules);
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons.splice(lessonIndex, 1);
    setModules(newModules);
  };

  const updateModuleTitle = (index: number, title: string) => {
    const newModules = [...modules];
    newModules[index].title = title;
    setModules(newModules);
  };

  const updateModuleDescription = (index: number, description: string) => {
    const newModules = [...modules];
    newModules[index].description = description;
    setModules(newModules);
  };

  const updateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    lesson: string
  ) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons[lessonIndex] = lesson;
    setModules(newModules);
  };

  return (
    <DashboardLayout userRole='admin'>
      <div className='mb-6'>
        <Link
          href='/dashboard/admin/courses'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Courses
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Create New Course</h1>
          <p className='text-muted-foreground'>
            Add a new swimming course to your catalog
          </p>
        </div>
      </div>

      <div className='grid gap-6 mt-8'>
        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>Basic details about the course</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='title'>Course Title</Label>
                <Input
                  id='title'
                  placeholder='e.g. Beginner Swimming'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='level'>Skill Level</Label>
                <Select>
                  <SelectTrigger id='level'>
                    <SelectValue placeholder='Select level' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='beginner'>Beginner</SelectItem>
                    <SelectItem value='intermediate'>Intermediate</SelectItem>
                    <SelectItem value='advanced'>Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='age'>Age Group</Label>
                <Input
                  id='age'
                  placeholder='e.g. 5+ years'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='duration'>Duration</Label>
                <Input
                  id='duration'
                  placeholder='e.g. 8 weeks'
                />
              </div>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='sessions'>Sessions</Label>
                <Input
                  id='sessions'
                  placeholder='e.g. 2 sessions per week, 45 minutes each'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='price'>Price</Label>
                <Input
                  id='price'
                  placeholder='e.g. $120'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Course Description</Label>
              <Textarea
                id='description'
                placeholder='Provide a detailed description of the course'
                className='min-h-[100px]'
              />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='prerequisites'>Prerequisites</Label>
                <Input
                  id='prerequisites'
                  placeholder='e.g. None'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='equipment'>Required Equipment</Label>
                <Input
                  id='equipment'
                  placeholder='e.g. Swimsuit, towel, goggles'
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Course Curriculum</CardTitle>
            <CardDescription>
              Define the modules and lessons for this course
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {modules.map((module, moduleIndex) => (
              <div
                key={moduleIndex}
                className='border rounded-lg p-4 space-y-4'
              >
                <div className='flex justify-between items-center'>
                  <h3 className='text-lg font-medium'>
                    Module {moduleIndex + 1}
                  </h3>
                  {modules.length > 1 && (
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => removeModule(moduleIndex)}
                    >
                      <Trash2 className='h-4 w-4' />
                      <span className='sr-only'>Remove Module</span>
                    </Button>
                  )}
                </div>
                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor={`module-title-${moduleIndex}`}>
                      Module Title
                    </Label>
                    <Input
                      id={`module-title-${moduleIndex}`}
                      value={module.title}
                      onChange={(e) =>
                        updateModuleTitle(moduleIndex, e.target.value)
                      }
                      placeholder='e.g. Water Comfort and Safety'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor={`module-description-${moduleIndex}`}>
                      Module Description
                    </Label>
                    <Textarea
                      id={`module-description-${moduleIndex}`}
                      value={module.description}
                      onChange={(e) =>
                        updateModuleDescription(moduleIndex, e.target.value)
                      }
                      placeholder='Describe what students will learn in this module'
                    />
                  </div>
                  <div className='space-y-2'>
                    <div className='flex justify-between items-center'>
                      <Label>Lessons</Label>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => addLesson(moduleIndex)}
                      >
                        <Plus className='h-4 w-4 mr-1' />
                        Add Lesson
                      </Button>
                    </div>
                    <div className='space-y-2'>
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lessonIndex}
                          className='flex gap-2'
                        >
                          <Input
                            value={lesson}
                            onChange={(e) =>
                              updateLesson(
                                moduleIndex,
                                lessonIndex,
                                e.target.value
                              )
                            }
                            placeholder={`Lesson ${lessonIndex + 1}`}
                          />
                          {module.lessons.length > 1 && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() =>
                                removeLesson(moduleIndex, lessonIndex)
                              }
                            >
                              <Trash2 className='h-4 w-4' />
                              <span className='sr-only'>Remove Lesson</span>
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant='outline'
              onClick={addModule}
            >
              <Plus className='h-4 w-4 mr-2' />
              Add Module
            </Button>
          </CardContent>
          <CardFooter className='flex justify-between'>
            <Button variant='outline'>Cancel</Button>
            <Button>Create Course</Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}
