<script lang="ts" setup>
import { watchEffect, ref } from 'vue';
import { Collapse, CollapseItem, Input, Dialog } from 'cosmic-vue';
import { router as vueRouter } from '@cosmic/core/browser';
import TeamItem from './team-menu-item.vue';
import { generateProjectForest } from '../../common/util/tree';
import { useProjects } from '../../project/api';
import { useAllTeams } from '../api';
import { useCreateProject } from '../../project/api';


interface Team extends gql.Team{
    avatar?: string;
}

const { executeMutation: createProject } = useCreateProject();

let teams = ref<Team[]>([]);
let projects  = ref<gql.Project[]>([]);
let teamMaps = ref(new Map);

const { useRoute, useRouter } = vueRouter;
const { query } = useRoute();
const router = useRouter();
const selectedTeam = ref<string>(query.team as string || '');

// TODO merge into one query in server side
const { data: teamData, fetching: teamFetching } = useAllTeams();
const { data: projectData, fetching: projectFetching } = useProjects({});

let newProject = ref<Partial<gql.CreateProjectDTO>>({
    name: '',
});
const openDialog = ref(false);

async function changeSelectedTeam(arg: string | { keys: string[] }) {
    const newValue = typeof arg === 'string' ? arg : arg.keys[0];
    if (!newValue) {
        return;
    }
    selectedTeam.value = newValue;
    router.push({ name: 'team:detail', query: { team: selectedTeam.value }});
}


watchEffect(() => {
    if (teamData.value && !teamFetching.value) {
        teams.value = teamData.value?.teams || [];
        if (projectData.value && !projectFetching.value) {
            projects.value = projectData.value.projects;
        }
        teamMaps.value = generateProjectForest(projects.value, teams.value.map(team => team.id));
        if (!selectedTeam.value) {
            changeSelectedTeam(teams.value[0].id);
        }
    }
});

const defautlAvatar = 'https://fe-dev.bj.bcebos.com/%E4%BE%A7%E8%BE%B9%E6%A0%8F%E5%9B%BE%E6%A0%8714*14.png';

function onAddProject(data: gql.CreateProjectDTO) {
    if (!data.name) {
        data.name = '';
    }
    newProject.value = data;
    openDialog.value = true;
}

function saveProject() {
    if (newProject.value && newProject.value.name) {
        createProject({ project: newProject.value }).finally(() => {
            openDialog.value = false;
        });
    }
}
</script>

<template>
    <collapse
        accordion
        :nullable="false"
        :active-key="selectedTeam"
        @change="changeSelectedTeam"
    >
        <collapse-item
            v-for="team in teams"
            :key="team.id"
            :header="team.name"
        >
            <template #prefix>
                <img :src="team.avatar || defautlAvatar" alt="SC">
            </template>
            <div class="w-full">
                <team-item :data="teamMaps.get(team.id)" :team="team.id" @add-project="onAddProject" />
            </div>
        </collapse-item>
    </collapse>
    <Dialog v-model:visible="openDialog" title="创建项目" :show-close-icon="false" @ok="saveProject">
        <div class="my-20">
            <Input v-model:value="newProject.name" placeholder="请输入项目名称" />
        </div>
    </Dialog>
</template>
