import { db } from '../src/db/drizzle';
import {
   teams,
   members,
   teamMembers,
   projects,
   projectMembers,
   tasks,
   taskStatusEnum,
   taskPriorityEnum,
} from '../src/db/schema';

import { users } from '../../mock-data/users';
import { teams as teamData } from '../../mock-data/teams';
import { projects as projectData } from '../../mock-data/projects';
import { issues } from '../../mock-data/issues';

// Maps for status and priority conversions
const statusMap: Record<string, (typeof taskStatusEnum)[number]> = {
   'in-progress': 'IN_PROGRESS',
   'technical-review': 'IN_PROGRESS',
   'completed': 'DONE',
   'paused': 'PAUSED',
   'to-do': 'TODO',
   'backlog': 'TODO',
};

const priorityMap: Record<string, (typeof taskPriorityEnum)[number]> = {
   'low': 'LOW',
   'medium': 'MED',
   'high': 'HIGH',
   'urgent': 'URGENT',
   'no-priority': 'LOW',
};

function toDate(value: string | undefined) {
   return value ? new Date(value) : null;
}

async function seed() {
   // Clear existing data
   db.delete(projectMembers).run();
   db.delete(teamMembers).run();
   db.delete(tasks).run();
   db.delete(projects).run();
   db.delete(members).run();
   db.delete(teams).run();

   // Insert members
   db.insert(members)
      .values(
         users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            avatarUrl: u.avatarUrl,
            status: u.status,
            role: u.role,
            joinedAt: toDate(u.joinedDate)!,
         }))
      )
      .run();

   // Insert teams
   db.insert(teams)
      .values(
         teamData.map((t) => ({
            id: t.id,
            name: t.name,
            icon: t.icon,
            color: t.color,
            joined: t.joined,
         }))
      )
      .run();

   // Team members from user.teamIds
   const tmRows: { teamId: string; memberId: string }[] = [];
   for (const u of users) {
      for (const teamId of u.teamIds) {
         tmRows.push({ teamId, memberId: u.id });
      }
   }
   if (tmRows.length) {
      db.insert(teamMembers).values(tmRows).run();
   }

   // Determine teamId for each project from teamData references
   const projectTeam = new Map<string, string>();
   for (const team of teamData) {
      for (const proj of team.projects) {
         if (!projectTeam.has(proj.id)) {
            projectTeam.set(proj.id, team.id);
         }
      }
   }

   // Insert projects
   db.insert(projects)
      .values(
         projectData.map((p) => ({
            id: p.id,
            name: p.name,
            status: p.status.id,
            percentComplete: p.percentComplete,
            startDate: toDate(p.startDate),
            teamId: projectTeam.get(p.id) ?? null,
            leadId: p.lead.id,
            priority: p.priority.id,
            health: p.health.id,
         }))
      )
      .run();

   // Project members: include project lead
   db.insert(projectMembers)
      .values(projectData.map((p) => ({ projectId: p.id, memberId: p.lead.id })))
      .run();

   // Insert tasks from issues
   db.insert(tasks)
      .values(
         issues.map((i) => ({
            id: Number(i.id),
            title: i.title,
            description: i.description,
            status: statusMap[i.status.id],
            priority: priorityMap[i.priority.id],
            createdAt: toDate(i.createdAt)!,
            dueAt: toDate(i.dueDate || undefined),
            projectId: i.project?.id ?? null,
            assigneeId: i.assignee?.id ?? null,
         }))
      )
      .run();

   console.log('Seed complete');
}

seed();
